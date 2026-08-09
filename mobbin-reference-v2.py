import os, urllib.request, json

# Sections filtered to: Lassie, Fixa, ToDesktop, Poly, Runner, Robot.com, Norma, Monologue, Linear
# (Fixer and F Norma -> Mobbin returned "Fixa" and "Norma" as closest matches)
sections = [
    # Linear (10)
    ("Linear", "https://mobbin.com/sites/sections/c5db0cc6-cd72-4388-b14e-2c7ae294bd0e", "https://mobbin.com/api/mcp/short/LDIbu2Lb"),
    ("Linear", "https://mobbin.com/sites/sections/ceb8e650-ab17-4718-bd60-be3afc93b1d1", "https://mobbin.com/api/mcp/short/yVwnJrIH"),
    ("Linear", "https://mobbin.com/sites/sections/40a46191-a57a-4bab-9a92-94fc14cad817", "https://mobbin.com/api/mcp/short/dnXaujaR"),
    ("Linear", "https://mobbin.com/sites/sections/8dddb841-9d25-4047-8f32-c793cee63a39", "https://mobbin.com/api/mcp/short/PfSyn1s2"),
    ("Linear", "https://mobbin.com/sites/sections/0e464c7e-94e9-43b1-a7a3-8f33bd04a16f", "https://mobbin.com/api/mcp/short/2as07raK"),
    ("Linear", "https://mobbin.com/sites/sections/b99fe27f-0826-490b-8dee-8fb256bfc740", "https://mobbin.com/api/mcp/short/LWGc5GKv"),
    ("Linear", "https://mobbin.com/sites/sections/f8b93019-f62b-4e58-8f0d-e577baa204f3", "https://mobbin.com/api/mcp/short/VL5k5wDi"),
    ("Linear", "https://mobbin.com/sites/sections/db0da4a6-735a-4fe8-8722-8fbd154d4496", "https://mobbin.com/api/mcp/short/SEeJ8gqX"),
    ("Linear", "https://mobbin.com/sites/sections/339ef9e8-57af-4599-999c-17e965a9a877", "https://mobbin.com/api/mcp/short/fxx6TQQ3"),
    ("Linear", "https://mobbin.com/sites/sections/0c5ba4e7-fd0e-458a-9922-4584dacbdec8", "https://mobbin.com/api/mcp/short/IrMCQhLN"),
    # Lassie (6)
    ("Lassie", "https://mobbin.com/sites/sections/7d697cd9-6238-4426-ba2b-285b63c7fdd6", "https://mobbin.com/api/mcp/short/WfZgwhlp"),
    ("Lassie", "https://mobbin.com/sites/sections/dcaae0e2-5def-449a-b47b-5eb5bd001b17", "https://mobbin.com/api/mcp/short/ryYcddB0"),
    ("Lassie", "https://mobbin.com/sites/sections/18728a1b-b0c9-4d37-b9f9-cde88ce58062", "https://mobbin.com/api/mcp/short/UOgbxExS"),
    ("Lassie", "https://mobbin.com/sites/sections/310955c5-6f5c-44eb-bb3c-ca0362b77008", "https://mobbin.com/api/mcp/short/sUPI5zIb"),
    ("Lassie", "https://mobbin.com/sites/sections/926d3a62-6a96-40d0-9c46-4965679df3c7", "https://mobbin.com/api/mcp/short/psvv5DUp"),
    ("Lassie", "https://mobbin.com/sites/sections/12951a6d-5b8b-441e-98fe-b0cb2a902198", "https://mobbin.com/api/mcp/short/2UkqT8Nq"),
    # Fixa (closest to Fixer) (2)
    ("Fixa (Fixer)", "https://mobbin.com/sites/sections/920d0adb-7d8b-4531-9659-faa024c815f8", "https://mobbin.com/api/mcp/short/Mz4kajJR"),
    ("Fixa (Fixer)", "https://mobbin.com/sites/sections/3b3c2b66-b096-4752-aa90-29d318ec9568", "https://mobbin.com/api/mcp/short/Z3fDKSNK"),
    # ToDesktop (6)
    ("ToDesktop", "https://mobbin.com/sites/sections/fd4cfacc-4566-4a17-8bf7-7e59bafca04b", "https://mobbin.com/api/mcp/short/M0qMEk9I"),
    ("ToDesktop", "https://mobbin.com/sites/sections/21611e0a-3a8f-4014-a0d7-fed0488bd480", "https://mobbin.com/api/mcp/short/WVir7rYv"),
    ("ToDesktop", "https://mobbin.com/sites/sections/90fefda0-8306-46f4-875c-6a8a37fed96f", "https://mobbin.com/api/mcp/short/fvJsBgTu"),
    ("ToDesktop", "https://mobbin.com/sites/sections/e182cf94-4363-4964-ae63-16b5b7791961", "https://mobbin.com/api/mcp/short/CfahkVOB"),
    ("ToDesktop", "https://mobbin.com/sites/sections/b7a57e38-c2a0-4261-8ba6-afa55b68029e", "https://mobbin.com/api/mcp/short/fb4Mw1Yh"),
    ("ToDesktop", "https://mobbin.com/sites/sections/89450139-fa9e-4052-a303-49998b2bd2c9", "https://mobbin.com/api/mcp/short/9ytm2yHP"),
    # Poly (6)
    ("Poly", "https://mobbin.com/sites/sections/0d05a504-60e0-42f4-9382-bec0b893208a", "https://mobbin.com/api/mcp/short/DdZe63AC"),
    ("Poly", "https://mobbin.com/sites/sections/80ecdb0b-349e-4a7c-a357-5674e18c8542", "https://mobbin.com/api/mcp/short/Yzdo4BQB"),
    ("Poly", "https://mobbin.com/sites/sections/47770993-617f-473a-9734-2050fa0ea9fc", "https://mobbin.com/api/mcp/short/7UhwjK82"),
    ("Poly", "https://mobbin.com/sites/sections/3e6e779c-7452-4654-8204-74eff55a9bb7", "https://mobbin.com/api/mcp/short/yEFaX45S"),
    ("Poly", "https://mobbin.com/sites/sections/c107bf8e-31f4-450c-9f69-aabc31474fcb", "https://mobbin.com/api/mcp/short/5yCTY2tc"),
    ("Poly", "https://mobbin.com/sites/sections/388fc4ca-dc36-47eb-affa-83379311fcbc", "https://mobbin.com/api/mcp/short/acoOUfAW"),
    # Runner (6)
    ("Runner", "https://mobbin.com/sites/sections/189776bc-f91f-481a-8abf-24a279f83f63", "https://mobbin.com/api/mcp/short/lBCcfGVI"),
    ("Runner", "https://mobbin.com/sites/sections/d6ecc2ee-e00b-4a71-80de-d1fe47fff0a6", "https://mobbin.com/api/mcp/short/5ajUUA9r"),
    ("Runner", "https://mobbin.com/sites/sections/c631db52-a980-4583-ad09-1f0fd4731e0c", "https://mobbin.com/api/mcp/short/tGScBMIe"),
    ("Runner", "https://mobbin.com/sites/sections/bae5ed92-7ee6-4a31-88d6-160c29ad6cf6", "https://mobbin.com/api/mcp/short/wvOE1kqu"),
    ("Runner", "https://mobbin.com/sites/sections/0ded7401-345c-4029-9ff4-620cbd2c5f7b", "https://mobbin.com/api/mcp/short/8nBnCu6Y"),
    ("Runner", "https://mobbin.com/sites/sections/1c808695-78df-4d7f-8073-0c4e57f1fed3", "https://mobbin.com/api/mcp/short/aTeeJQ3C"),
    # Robot.com (4)
    ("Robot.com", "https://mobbin.com/sites/sections/5bbc90c2-05e6-4626-a10c-3da9e38830ce", "https://mobbin.com/api/mcp/short/IFmkK3O8"),
    ("Robot.com", "https://mobbin.com/sites/sections/591db5e7-4c33-4081-81dc-8e7cf4b28e53", "https://mobbin.com/api/mcp/short/Yg6l45Qi"),
    ("Robot.com", "https://mobbin.com/sites/sections/17dab1a2-5558-42bb-a1fb-010259caa5ae", "https://mobbin.com/api/mcp/short/5vBDOXqq"),
    ("Robot.com", "https://mobbin.com/sites/sections/e3577e3e-4b7f-4bf1-8058-627bcce0b790", "https://mobbin.com/api/mcp/short/z8lLzmjg"),
    # Monologue (8)
    ("Monologue", "https://mobbin.com/sites/sections/7161530e-b739-4971-94b7-72381ee13368", "https://mobbin.com/api/mcp/short/lnoF7Wvl"),
    ("Monologue", "https://mobbin.com/sites/sections/fbde692b-9ae3-46fa-baa1-ba2ead776aa6", "https://mobbin.com/api/mcp/short/1hpocvH7"),
    ("Monologue", "https://mobbin.com/sites/sections/ca301838-13c1-4174-b29d-7ffb594935c4", "https://mobbin.com/api/mcp/short/aHgj1tV4"),
    ("Monologue", "https://mobbin.com/sites/sections/13687cde-f9cf-441f-832c-932cb2668d06", "https://mobbin.com/api/mcp/short/t6ldhMep"),
    ("Monologue", "https://mobbin.com/sites/sections/71630695-c9ff-43c8-a9a7-1feed054955d", "https://mobbin.com/api/mcp/short/dENy4R6D"),
    ("Monologue", "https://mobbin.com/sites/sections/ce51e0dc-9e64-472b-8668-cb71ddb1f47f", "https://mobbin.com/api/mcp/short/WAcNfoHj"),
    ("Monologue", "https://mobbin.com/sites/sections/b8943ab7-c4ba-4d7b-9b4f-b300f7acc221", "https://mobbin.com/api/mcp/short/hzHGgpKo"),
    # Norma (closest to "F Norma") (9)
    ("Norma", "https://mobbin.com/sites/sections/e2c98980-269f-432e-a8bc-55c981de2359", "https://mobbin.com/api/mcp/short/vZ8SfiGX"),
    ("Norma", "https://mobbin.com/sites/sections/1ee75ebd-f4c5-4fdb-99b8-8b3a7bc77175", "https://mobbin.com/api/mcp/short/puTaOWrY"),
    ("Norma", "https://mobbin.com/sites/sections/857a4823-e36c-4392-b388-5012f2c0a2b6", "https://mobbin.com/api/mcp/short/6JIVbF4c"),
    ("Norma", "https://mobbin.com/sites/sections/526de761-73ae-46b3-8b55-ce9cfbb67cb4", "https://mobbin.com/api/mcp/short/3YjxbaaP"),
    ("Norma", "https://mobbin.com/sites/sections/4f226657-7aca-4db4-9d7f-6f9039ee84ba", "https://mobbin.com/api/mcp/short/OOVi7ddJ"),
    ("Norma", "https://mobbin.com/sites/sections/df0ed1db-c499-4e08-be65-7bbc29214583", "https://mobbin.com/api/mcp/short/NOKlUXin"),
    ("Norma", "https://mobbin.com/sites/sections/4e75b10e-428b-4709-b512-11d5380e0eda", "https://mobbin.com/api/mcp/short/lTTEkYsj"),
    ("Norma", "https://mobbin.com/sites/sections/cc6fe797-f3aa-4a78-a283-bde7fb1df9ae", "https://mobbin.com/api/mcp/short/sqI9kzN7"),
    ("Norma", "https://mobbin.com/sites/sections/96f4183b-7eb5-437c-90ad-95d1306d320c", "https://mobbin.com/api/mcp/short/djcBdGi2"),
]

assets_dir = "/Users/mikeyitua/Desktop/playground projects/reveal/mobbin-assets"
# Clean old assets
import shutil
if os.path.exists(assets_dir):
    shutil.rmtree(assets_dir)
os.makedirs(assets_dir, exist_ok=True)

idx = 0
downloaded = 0
cards = ""
for site_name, mobbin_url, image_url in sections:
    filename = str(idx) + "-" + site_name.lower().replace(" ", "").replace("(", "").replace(")", "") + ".webp"
    filepath = os.path.join(assets_dir, filename)
    try:
        urllib.request.urlretrieve(image_url, filepath)
        downloaded += 1
    except Exception as e:
        print("Failed " + filename + ": " + str(e))
    cards += '      <div class="card">'
    cards += '<a href="' + mobbin_url + '" target="_blank">'
    cards += '<img src="mobbin-assets/' + filename + '" alt="' + site_name + ' section" loading="lazy" />'
    cards += '<div class="label">' + site_name + '</div>'
    cards += '</a></div>'
    idx += 1

html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n'
html += '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
html += '<title>Mobbin Curated — Reveal Marketing</title>\n<style>'
html += ':root { --bg: #000B14; --card: #051929; --accent: #19A7CE; --text: #f0f0f0; --muted: #8892b0; }'
html += '* { margin: 0; padding: 0; box-sizing: border-box; }'
html += 'body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; padding: 40px; }'
html += 'h1 { font-size: 28px; margin-bottom: 8px; }'
html += '.subtitle { color: var(--muted); margin-bottom: 32px; font-size: 14px; }'
html += '.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }'
html += '.card { background: var(--card); border-radius: 12px; overflow: hidden; border: 1px solid #1a2a3a; transition: border-color 0.2s; }'
html += '.card:hover { border-color: var(--accent); }'
html += '.card a { text-decoration: none; color: inherit; display: block; }'
html += '.card img { width: 100%; height: auto; display: block; }'
html += '.label { padding: 10px 14px; font-size: 13px; font-weight: 600; color: var(--accent); text-align: center; }'
html += 'footer { margin-top: 60px; text-align: center; color: var(--muted); font-size: 12px; }'
html += '</style></head><body>'
html += '<h1>Reveal — Mobbin Curated References</h1>'
html += '<p class="subtitle">Sites you named: Linear, Lassie, ToDesktop, Poly, Runner, Robot.com, Norma, Monologue, Fixer (Fixa). Click any card to view on Mobbin.</p>'
html += '<div class="grid">' + cards + '</div>'
html += '<footer>Curated from Mobbin — these are the sites you liked</footer></body></html>'

output_path = "/Users/mikeyitua/Desktop/playground projects/reveal/mobbin-reference.html"
with open(output_path, "w") as f:
    f.write(html)

print("Done: " + str(downloaded) + " images downloaded")
print("HTML: " + output_path)
print("View: http://localhost:8080/mobbin-reference.html")
