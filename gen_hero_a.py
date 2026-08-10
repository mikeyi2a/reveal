import json

# Hero A (Lassie-style centered hero)
hero_a_html = '<div style="display: flex; flex-direction: column; align-items: center; gap: 24px; width: 1320px;">'
hero_a_html += '<div style="display: flex; justify-content: space-between; width: 100%;">'
hero_a_html += '<div style="width: 160px; height: 48px; background: #19A7CE; border-radius: 8px;" layer-name="Logo"></div>'
hero_a_html += '<div style="display: flex; gap: 24px;">'
hero_a_html += '<div style="width: 80px; height: 24px; background: #C7C2BA; border-radius: 4px;" layer-name="Nav:Features"></div>'
hero_a_html += '<div style="width: 80px; height: 24px; background: #C7C2BA; border-radius: 4px;" layer-name="Nav:Demo"></div>'
hero_a_html += '<div style="width: 80px; height: 24px; background: #C7C2BA; border-radius: 4px;" layer-name="Nav:Login"></div>'
hero_a_html += '</div></div>'
hero_a_html += '<div style="display: flex; flex-direction: column; align-items: center; gap: 32px; margin-top: 80px;">'
hero_a_html += '<div style="width: 80px; height: 80px; background: #19A7CE; border-radius: 16px;" layer-name="Brand Icon"></div>'
hero_a_html += '<div style="width: 600px; height: 72px; background: #12D453; border-radius: 6px;" layer-name="Hero_A_Headline"></div>'
hero_a_html += '<div style="width: 500px; height: 28px; background: #8D9AA6; border-radius: 4px;" layer-name="Hero_A_Subhead"></div>'
hero_a_html += '</div>'
hero_a_html += '<div style="display: flex; gap: 20px; margin-top: 40px;">'
hero_a_html += '<div style="width: 160px; height: 48px; background: #19A7CE; border-radius: 9999px;" layer-name="CTA: Try for free"></div>'
hero_a_html += '<div style="width: 140px; height: 48px; background: rgba(255,255,255,0.05); border: 1px solid #16364D; border-radius: 9999px;" layer-name="Secondary: Watch demo"></div>'
hero_a_html += '</div>'
hero_a_html += '<div style="margin-top: 80px; width: 200px; height: 24px; background: #19A7CE; border-radius: 4px;" layer-name="Hero_A_Badge: Trusted by"></div>'
hero_a_html += '</div>'

with open("/tmp/hero_a_html.txt", "w") as f:
    f.write(hero_a_html)
print("Hero A HTML generated, chars:", len(hero_a_html))