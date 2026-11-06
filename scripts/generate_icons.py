import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_duomate_icon(output_dir="d:/aadhavan/Duomate_project/public"):
    os.makedirs(output_dir, exist_ok=True)
    
    # Render at 1024x1024 for supersampling to 512x512
    W, H = 1024, 1024
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    
    # 1. Outer rounded container with squircle radius 220
    # Background gradient: Midnight navy/violet (#0c0e1a -> #18122b)
    # We will draw a smooth radial and linear gradient background
    bg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)
    
    # Draw rounded rect mask
    mask = Image.new("L", (W, H), 0)
    mask_draw = ImageDraw.Draw(mask)
    margin = 40
    radius = 220
    mask_draw.rounded_rectangle([margin, margin, W - margin, H - margin], radius=radius, fill=255)
    
    # Create gradient fill
    for y in range(H):
        t = y / H
        # Indigo-violet gradient
        r = int(12 + t * 24)
        g = int(14 + t * 8)
        b = int(32 + t * 45)
        bg_draw.line([(0, y), (W, y)], fill=(r, g, b, 255))
        
    # Apply mask to background
    im.paste(bg, (0, 0), mask)
    
    # 2. Glowing ambient halos inside
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    halo_draw = ImageDraw.Draw(halo)
    
    # Aadhavan orb (Indigo/Blue glow, top-left)
    halo_draw.ellipse([140, 140, 600, 600], fill=(99, 102, 241, 130))
    # Narmatha orb (Purple/Rose glow, bottom-right)
    halo_draw.ellipse([424, 424, 884, 884], fill=(217, 70, 239, 130))
    # Central mutual glow (Cyan/Amber bridge)
    halo_draw.ellipse([340, 340, 684, 684], fill=(168, 85, 247, 160))
    
    halo = halo.filter(ImageFilter.GaussianBlur(radius=80))
    im.paste(halo, (0, 0), mask)
    
    # 3. Outer gradient border ring
    border_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    border_draw = ImageDraw.Draw(border_overlay)
    border_draw.rounded_rectangle([margin + 2, margin + 2, W - margin - 2, H - margin - 2], radius=radius, outline=(255, 255, 255, 45), width=6)
    im = Image.alpha_composite(im, border_overlay)
    
    # 4. Central Duo Symbol: Two Interlocking Rings / Infinity Wings
    # Representing Aadhavan & Narmatha united with synergy
    sym = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sym_draw = ImageDraw.Draw(sym)
    
    # Left ring (Aadhavan - Cyan/Indigo)
    sym_draw.ellipse([260, 370, 560, 670], outline=(129, 140, 248, 255), width=36)
    # Right ring (Narmatha - Purple/Pink)
    sym_draw.ellipse([464, 370, 764, 670], outline=(244, 114, 182, 255), width=36)
    
    # Central overlap connection glow
    sym_draw.ellipse([380, 420, 644, 620], outline=(255, 255, 255, 220), width=18)
    
    # Circuit connection nodes (Tech / VLSI / GATE motif)
    nodes = [
        (260, 520, (129, 140, 248)),
        (560, 520, (255, 255, 255)),
        (464, 520, (255, 255, 255)),
        (764, 520, (244, 114, 182)),
        (410, 370, (168, 85, 247)),
        (614, 370, (217, 70, 239)),
        (410, 670, (129, 140, 248)),
        (614, 670, (244, 114, 182)),
        (512, 330, (253, 224, 71)), # Top star / goal
    ]
    for x, y, col in nodes:
        sym_draw.ellipse([x - 18, y - 18, x + 18, y + 18], fill=col + (255,))
        sym_draw.ellipse([x - 8, y - 8, x + 8, y + 8], fill=(255, 255, 255, 255))
        
    # Circuit lines to top star
    sym_draw.line([(512, 330), (410, 370)], fill=(255, 255, 255, 160), width=6)
    sym_draw.line([(512, 330), (614, 370)], fill=(255, 255, 255, 160), width=6)
    
    # Monogram "DM" typography
    try:
        font = ImageFont.truetype("arialbd.ttf", 150)
    except:
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 150)
        except:
            font = ImageFont.load_default()
            
    bbox = font.getbbox("DM")
    fw = bbox[2] - bbox[0]
    fh = bbox[3] - bbox[1]
    tx = (W - fw) // 2
    ty = 460
    
    # Shadow for DM
    sym_draw.text((tx + 4, ty + 6), "DM", font=font, fill=(0, 0, 0, 180))
    # Crisp white DM
    sym_draw.text((tx, ty), "DM", font=font, fill=(255, 255, 255, 255))
    
    # Small subtitle: "DUOMATE" at bottom
    try:
        small_font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 46)
    except:
        small_font = font
    sub = "DUOMATE"
    sbbox = small_font.getbbox(sub)
    sw = sbbox[2] - sbbox[0]
    sx = (W - sw) // 2
    sym_draw.text((sx, 760), sub, font=small_font, fill=(203, 213, 225, 220))
    
    im = Image.alpha_composite(im, sym)
    
    # Downsample with Lanczos for anti-aliasing
    final_512 = im.resize((512, 512), Image.Resampling.LANCZOS)
    
    # Save outputs
    final_512.save(os.path.join(output_dir, "icon-512.png"))
    
    final_192 = final_512.resize((192, 192), Image.Resampling.LANCZOS)
    final_192.save(os.path.join(output_dir, "icon-192.png"))
    
    final_180 = final_512.resize((180, 180), Image.Resampling.LANCZOS)
    final_180.save(os.path.join(output_dir, "apple-touch-icon.png"))
    
    final_64 = final_512.resize((64, 64), Image.Resampling.LANCZOS)
    final_64.save(os.path.join(output_dir, "favicon-64.png"))
    
    final_32 = final_512.resize((32, 32), Image.Resampling.LANCZOS)
    final_32.save(os.path.join(output_dir, "favicon.png"))
    
    # Save multi-size favicon.ico
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    final_512.save(os.path.join(output_dir, "favicon.ico"), format="ICO", sizes=ico_sizes)
    
    print("Generated all icon assets successfully in", output_dir)

if __name__ == "__main__":
    create_duomate_icon()

