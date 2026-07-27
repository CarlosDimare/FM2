import json

path = "C:/Users/murga/haz/audio-editor-colab/audio_editor.ipynb"
with open(path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Get cell 7 source
cells7 = nb["cells"][7]
src = "".join(cells7["source"])

# Find the TUI code between triple single quotes
start = src.find("'''")
end = src.rfind("'''")
tui = src[start+3:end]

print(f"TUI code length: {len(tui)} chars")
print("Checking for problematic \\n patterns...")

# Find all backslash-n sequences in the TUI code
# These are \n that are inside string literals in the TUI source
# and will be eaten by the '''...''' string

# Fix 1: segfile.write with \n -> use print(file=segfile)
old1 = '''segfile.write(f"file '{Path(AUDIO_PATH).resolve()}'\\n")'''
new1 = '''print(f"file '{Path(AUDIO_PATH).resolve()}'", file=segfile)'''

old2 = '''segfile.write(f"inpoint {start}\\n")'''
new2 = '''print(f"inpoint {start}", file=segfile)'''

old3 = '''segfile.write(f"outpoint {end}\\n")'''
new3 = '''print(f"outpoint {end}", file=segfile)'''

print(f"  Pattern 1: {old1 in tui}")
print(f"  Pattern 2: {old2 in tui}")
print(f"  Pattern 3: {old3 in tui}")

# Apply fixes
tui_fixed = tui.replace(old1, new1).replace(old2, new2).replace(old3, new3)

# Check if there are any remaining \n that should be literal
# (there shouldn't be in the TUI code - actual newlines are fine)
import re
backslash_n = re.findall(r'\\\\n', tui_fixed)
print(f"Remaining backslash-n sequences: {len(backslash_n)}")

# Replace the source cell
cells7_source = src[:start+3] + tui_fixed + src[end:]
nb["cells"][7]["source"] = [cells7_source]

with open(path, "w", encoding="utf-8") as f:
    json.dump(nb, f, ensure_ascii=False, indent=2)

# Verify the fix
with open(path, "r", encoding="utf-8") as f:
    nb2 = json.load(f)
src2 = "".join(nb2["cells"][7]["source"])
start2 = src2.find("'''")
end2 = src2.rfind("'''")
tui2 = src2[start2+3:end2]

# Check that the fix was applied
print(f"\nAfter fix:")
print(f"  print(file=segfile) in TUI: {'print(file=segfile)' in tui2}")
print(f"  segfile.write in TUI: {'segfile.write' in tui2}")
try:
    compile(tui2, "<tui>", "exec")
    print(f"  Python syntax: VALID")
except SyntaxError as e:
    print(f"  SYNTAX ERROR: {e}")
