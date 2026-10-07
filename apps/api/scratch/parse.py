import json
with open('C:/Users/shyam/.gemini/antigravity-ide/brain/cc8c6657-85cc-44a4-bbc6-f089cc1ed7b0/.system_generated/steps/653/content.md', 'r', encoding='utf-8') as f:
    html = f.read()
import re
for match in re.findall(r'api\.mobbin\.com[^\"<\s]+', html):
    print(match)
for match in re.findall(r'\"serverUrl\"[^,}]+', html):
    print(match)
