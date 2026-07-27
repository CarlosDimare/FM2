#!/usr/bin/env python3
"""editor.py — Editor de Audio por Texto para Google Cloud Shell.
Uso: python editor.py
"""
import os, sys, json, uuid, hashlib, threading, tempfile, time, subprocess
from pathlib import Path

try:
    from textual.app import App, ComposeResult
    from textual.widgets import Header, Footer, Static, TextArea, Button
    from textual.containers import Horizontal, Vertical, ScrollableContainer
    from textual.screen import ModalScreen
    from textual.binding import Binding
    HAS_TEXTUAL = True
except: HAS_TEXTUAL = False

AUDIO_PATH = None; WORDS = []; DURATION = 0.0; PROJECT_ID = None
PREVIEW_PORT = 8080; PREVIEW_SERVER = None
BASE = Path(__file__).parent; CACHE_DIR = BASE/"cache"; OUTPUT_DIR = BASE/"output"
CACHE_DIR.mkdir(exist_ok=True); OUTPUT_DIR.mkdir(exist_ok=True)

def check_prereqs():
    global PROJECT_ID
    print("\n=== Verificando entorno ===")
    try: subprocess.run(["ffmpeg","-version"], capture_output=True); print("  [OK] ffmpeg")
    except:
        print("  Instalando ffmpeg...")
        subprocess.run(["sudo","apt-get","install","-y","-qq","ffmpeg"], check=True)
        print("  [OK] ffmpeg")
    try:
        r = subprocess.run(["gcloud","--version"], capture_output=True, text=True)
        print(f"  [OK] gcloud")
    except: print("  [ERROR] gcloud no encontrado"); return False
    r = subprocess.run(["gcloud","config","get-value","project"],capture_output=True,text=True)
    PROJECT_ID = r.stdout.strip()
    if not PROJECT_ID:
        name = input("  No hay proyecto. Nombre del proyecto a crear: ").strip()
        if name:
            subprocess.run(["gcloud","projects","create",name], check=True)
            subprocess.run(["gcloud","config","set","project",name], check=True)
            PROJECT_ID = nameame
        else: return False
    print(f"  Proyecto: {PROJECT_ID}")
    subprocess.run(["gcloud","services","enable","speech.googleapis.com",
                    "--project",PROJECT_ID], capture_output=True)
    print("  [OK] Speech-to-Text API")
    for p in ["textual","google-cloud-speech"]:
        subprocess.run([sys.executable,"-m","pip","install","-q",p], capture_output=True)
        print(f"  [OK] {p}")
    return True

def transcribe(audio_path):
    from google.cloud import speech
    print("  Transcribiendo con Google Cloud STT (Chirp)...")
    with open(audio_path,"rb") as f: content = f.read()
    ext = Path(audio_path).suffix.lower()
    enc_map = {".wav":1,".mp3":2,".ogg":3,".flac":4}  # LINEAR16, MP3, OGG, FLAC
    enc = enc_map.get(ext, 1)
    client = speech.SpeechClient()
    config = speech.RecognitionConfig(
        encoding=enc, sample_rate_hertz=16000, language_code="es-ES",
        model="chirp", enable_word_time_offsets=True, enable_automatic_punctuation=True)
    audio = speech.RecognitionAudio(content=content)
    op = client.long_running_recognize(config=config, audio=audio)
    t0 = time.time()
    resp = op.result(timeout=300)
    words = []; wid = 0
    for r in resp.results:
        for a in r.alternatives:
            for w in a.words:
                words.append({"id":wid,"text":w.word,"start":w.start_time.total_seconds(),
                              "end":w.end_time.total_seconds()})
                wid += 1
    dur = words[-1]["end"] if words else 0
    print(f"  {len(words)} palabras en {round(time.time()-t0,2)}s")
    return {"duration":dur,"words":words}

def render_edited(source, segments, out):
    sf = tempfile.NamedTemporaryFile(mode="w",suffix=".txt",delete=False)
    try:
        for s,e in segments:
            if e-s<=0: continue
            print(f"file '{Path(source).resolve()}'",file=sf)
            print(f"inpoint {s}",file=sf); print(f"outpoint {e}",file=sf)
        sf.close()
        subprocess.run(["ffmpeg","-y","-f","concat","-safe","0",
                       "-i",sf.name,"-c","copy",out],check=True,capture_output=True)
    finally: Path(sf.name).unlink(missing_ok=True)

def start_preview_server(audio_path):
    global PREVIEW_SERVER
    if PREVIEW_SERVER: return
    import http.server, socketserver
    DIR = Path(audio_path).parent
    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(self,*a,**kw): super().__init__(*a,directory=str(DIR),**kw)
        def log_message(self,*a): pass
    def run():
        with socketserver.TCPServer(("",PREVIEW_PORT),H) as s: s.serve_forever()
    PREVIEW_SERVER = threading.Thread(target=run, daemon=True); PREVIEW_SERVER.start()
    print(f"\n  Preview: http://localhost:{PREVIEW_PORT}/{Path(audio_path).name}")
    print(f"  (Web Preview > Puerto {PREVIEW_PORT})")

def compute_surviving_ids(ow, txt):
    ed = txt.strip().lower().split()
    if not ed: return []
    m = {}
    for w in ow: m.setdefault(w["text"].lower(),[]).append(w["id"])
    used=set(); r=[]
    for e in ed:
        q=m.get(e)
        if q:
            for sid in q:
                if sid not in used: used.add(sid); r.append(sid); break
    return r

# ── Textual widgets ──────────────────────────────────────────────


def get_duration(path):
    r = subprocess.run(["ffprobe","-v","quiet","-print_format","json","-show_format",path],
                      capture_output=True,text=True,check=True)
    return float(json.loads(r.stdout)["format"]["duration"])

class WordChip(Static):
    def __init__(self,word,**kw):
        super().__init__(word["text"],**kw); self.word=word
    def on_click(self,e):
        if e.button==3:
            self.app.push_screen(ContextMenu(self.word))
        else:
            self.app.notify(f"{self.word['text']} ({self.word['start']}s-{self.word['end']}s)")

class WordChips(ScrollableContainer):
    def __init__(self,words,**kw):
        super().__init__(**kw); self.words=words
    def compose(self):
        for w in self.words: yield WordChip(w,classes="chip")
    def update_chips(self,txt):
        eds = set(txt.strip().lower().split())
        for c in self.query(WordChip):
            ok = c.word["text"].lower() in eds
            c.set_class(not ok,"deleted"); c.set_class(ok,"present")

class ContextMenu(ModalScreen):
    def __init__(self,word,**kw):
        super().__init__(**kw); self.word=word
    def compose(self):
        with Vertical(id="menu"):
            yield Static(f"Palabra: [bold]{self.word['text']}[/bold]",id="title")
            yield Button("Borrar palabra",id="del",variant="error")
            yield Button("Silenciar 0.5s",id="sil"); yield Button("Separar",id="sp")
            yield Button("Cancelar",id="cancel")
    def on_button_pressed(self,e):
        if e.button.id=="cancel": self.app.pop_screen(); return
        self.app.pop_screen()
        ed = self.app.query_one("#editor",TextArea); t=ed.text; w=self.word
        if e.button.id=="del": ed.text=t.replace(w["text"],"",1).replace("  "," ")
        elif e.button.id=="sil": ed.text=t.replace(w["text"],"[silencio]",1)
        elif e.button.id=="sp": ed.text=t.replace(w["text"],w["text"]+"\n\n",1)
        self.app.sync_chips()

class EditorScreen(Static):
    def compose(self):
        fn = Path(AUDIO_PATH).name if AUDIO_PATH else "---"
        yield Static(f"Audio: {fn} | {DURATION:.1f}s | Google STT",id="info")
        with Horizontal(id="tb"):
            yield Button("> Preview (Ctrl+P)",id="play",variant="primary")
            yield Button("Render (Ctrl+R)",id="ren")
            yield Button("Descargar",id="dl"); yield Button("Salir",id="quit",variant="error")
        yield WordChips(WORDS,id="chips")
        yield TextArea(id="editor",soft_wrap=True,show_line_numbers=False)
        yield Static(id="status")
    def on_mount(self):
        self.query_one("#editor",TextArea).text = " ".join(w["text"] for w in WORDS)
        self.sync_chips()
    def sync_chips(self):
        self.query_one("#chips",WordChips).update_chips(self.query_one("#editor",TextArea).text)
    def on_button_pressed(self,e):
        m={"play":"preview","ren":"render","dl":"download","quit":"quit"}
        a=m.get(e.button.id)
        if a: getattr(self.app,f"action_{a}")()

class AudioEditorApp(App):
    CSS = """
    Screen{background:#1a1a2e}#info{padding:1 2;color:#8af;text-style:bold}
    #tb{margin:0 1;height:3}#tb Button{margin:0 1 0 0;min-width:16}
    #chips{height:7;border:solid #3d3d5e;margin:1 1;padding:1;overflow-y:auto}
    .chip{padding:0 1;margin:0 1 1 0;background:#2d2d5e}
    .chip:hover{background:#4d4d8e}.chip.deleted{background:#3a1a1a;text-style:strikethrough;color:#666}
    .chip.present{background:#2d2d5e;color:#e0e0e0}
    #editor{margin:0 1;border:solid #3d3d5e;height:10}
    #editor:focus{border:solid #5a5a9e}#status{padding:1 2;color:#888}
    #menu{background:#22224a;border:thick #3d3d6e;padding:1;width:40;margin:8 12}
    #title{padding:0 0 1 0;text-style:bold}#menu Button{margin:0 0 1 0}
    """
    BINDINGS=[Binding("ctrl+r","render"),Binding("ctrl+p","preview"),Binding("ctrl+q","quit"),Binding("escape","close_menu")]
    last_rendered=None
    def compose(self): yield Header(); yield EditorScreen(); yield Footer()
    def on_mount(self): self.title="Editor de Audio por Texto"; self.sub_title="Edita el texto para editar el audio"
    def sync_chips(self): self.query_one(EditorScreen).sync_chips()
    def action_render(self):
        ed=self.query_one("#editor",TextArea); st=self.query_one("#status"); st.update("Renderizando...")
        ids=compute_surviving_ids(WORDS,ed.text)
        if not ids: st.update("Sin palabras"); return
        segs=[(w["start"],w["end"]) for sid in ids for w in [next((x for x in WORDS if x["id"]==sid),None)] if w]
        out=str(OUTPUT_DIR/f"editado_{uuid.uuid4().hex[:8]}.wav")
        render_edited(AUDIO_PATH,segs,out); d=get_duration(out)
        st.update(f"Renderizado: {Path(out).name} ({Path(out).stat().st_size//1024}KB, {d:.1f}s)")
        self.last_rendered=out; self.notify("Audio renderizado!")
    def action_preview(self):
        ed=self.query_one("#editor",TextArea); st=self.query_one("#status"); st.update("Preparando preview...")
        ids=compute_surviving_ids(WORDS,ed.text)
        if not ids: st.update("Sin palabras"); return
        segs=[(w["start"],w["end"]) for sid in ids for w in [next((x for x in WORDS if x["id"]==sid),None)] if w]
        out=str(OUTPUT_DIR/f"preview_{uuid.uuid4().hex[:8]}.wav")
        render_edited(AUDIO_PATH,segs,out); self.last_rendered=out
        start_preview_server(out)
        st.update(f"Preview: http://localhost:{PREVIEW_PORT}/{Path(out).name}")
        self.notify("Preview listo! Abri Web Preview")
    def action_download(self):
        if self.last_rendered and Path(self.last_rendered).exists():
            p=Path(self.last_rendered); print(f"\n  Descarga: {p.resolve()}")
            print("  Usa el icono ⋮ > Descargar archivo en Cloud Shell")
        else: self.notify("Primero renderiza (Ctrl+R)",severity="warning")
    def action_quit(self): self.exit()
    def action_close_menu(self):
        if self.screen is not self: self.pop_screen()


def main():
    global AUDIO_PATH,WORDS,DURATION
    print("\n  Editor de Audio por Texto\n  =========================")
    if not check_prereqs(): sys.exit(1)
    # Reload imports
    global HAS_TEXTUAL
    if not HAS_TEXTUAL:
        try: from textual.app import App as _; HAS_TEXTUAL=True
        except: print("ERROR: textual"); sys.exit(1)
    print("\n  Archivos de audio en este directorio:")
    for f in sorted(BASE.glob("*")):
        if f.suffix.lower() in (".wav",".mp3",".ogg",".flac",".m4a"):
            print(f"    {f.name} ({f.stat().st_size//1024}KB)")
    p = input("\n  Path del audio (Enter para mostrar ayuda): ").strip()
    if not p:
        print("  Arrastra el archivo a Cloud Shell, luego escribe el path.")
        p = input("  Path: ").strip()
    if not os.path.exists(p): print(f"  No encontrado: {p}"); sys.exit(1)
    AUDIO_PATH = str(Path(p).resolve())
    ext = Path(AUDIO_PATH).suffix.lower()
    if ext != ".wav":
        wav = str(CACHE_DIR/f"conv_{uuid.uuid4().hex[:8]}.wav")
        print("  Convirtiendo a WAV...")
        subprocess.run(["ffmpeg","-y","-i",AUDIO_PATH,"-acodec","pcm_s16le","-ar","16000",wav],
                      check=True,capture_output=True)
        AUDIO_PATH = wav
    try:
        r = transcribe(AUDIO_PATH); WORDS=r["words"]; DURATION=r["duration"]
    except Exception as e: print(f"  ERROR: {e}"); sys.exit(1)
    cp = CACHE_DIR/f"{hashlib.md5(Path(AUDIO_PATH).read_bytes()).hexdigest()}.json"
    cp.write_text(json.dumps({"duration":DURATION,"words":WORDS},ensure_ascii=False),encoding="utf-8")
    print("  Lanzando editor...")
    AudioEditorApp().run()

if __name__=="__main__": main()
