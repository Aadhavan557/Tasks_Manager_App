import math
import random
from PIL import Image, ImageDraw, ImageFilter

def generate_flower_wallpaper(filepath="d:/aadhavan/Duomate_project/public/floral-bg.jpg"):
    W, H = 1920, 1080
    im = Image.new("RGBA", (W, H), (10, 12, 24, 255))
    draw = ImageDraw.Draw(im)

    # Gradient backdrop: deep midnight twilight to soft plum/rose
    for y in range(H):
        t = y / H
        r = int(8 + t * 24 + math.sin(t * math.pi) * 15)
        g = int(10 + t * 14 + math.sin(t * math.pi) * 8)
        b = int(22 + t * 35 + math.sin(t * math.pi) * 20)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Ambient dreamy floral glow spots
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    
    glow_spots = [
        (200, 200, (236, 72, 153, 90), 300),
        (W - 250, 220, (168, 85, 247, 95), 320),
        (180, H - 220, (129, 140, 248, 85), 280),
        (W - 220, H - 200, (244, 114, 182, 100), 320),
        (W // 2, 120, (192, 132, 252, 70), 250),
        (W // 2, H - 100, (251, 113, 133, 75), 260),
    ]
    for gx, gy, col, rad in glow_spots:
        glow_draw.ellipse([gx - rad, gy - rad, gx + rad, gy + rad], fill=col)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=90))
    im = Image.alpha_composite(im, glow_layer)

    # Function to draw a blossom (cherry blossom / peony style)
    def draw_flower(cx, cy, radius, base_color, accent_color, petals_count=5, angle_offset=0):
        flower_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        fd = ImageDraw.Draw(flower_layer)
        
        # Petals
        for i in range(petals_count):
            ang = angle_offset + (i * 2 * math.pi / petals_count)
            # Center of petal
            dist = radius * 0.65
            px = cx + math.cos(ang) * dist
            py = cy + math.sin(ang) * dist
            
            # Draw elongated petal as pie/ellipse
            pr = radius * 0.55
            bbox = [px - pr, py - pr * 1.2, px + pr, py + pr * 1.2]
            fd.ellipse(bbox, fill=base_color)
            
            # Inner petal highlight
            in_pr = pr * 0.65
            fd.ellipse([px - in_pr, py - in_pr * 0.9, px + in_pr, py + in_pr * 0.9], fill=accent_color)
            
        # Golden floral pistils / stamen in center
        fd.ellipse([cx - radius * 0.28, cy - radius * 0.28, cx + radius * 0.28, cy + radius * 0.28], fill=(253, 224, 71, 230))
        fd.ellipse([cx - radius * 0.16, cy - radius * 0.16, cx + radius * 0.16, cy + radius * 0.16], fill=(245, 158, 11, 255))
        
        # Stamen dots
        for a in range(8):
            sang = a * (2 * math.pi / 8)
            sx = cx + math.cos(sang) * radius * 0.24
            sy = cy + math.sin(sang) * radius * 0.24
            fd.ellipse([sx - 3, sy - 3, sx + 3, sy + 3], fill=(254, 240, 138, 240))
            
        return flower_layer

    # Draw clusters along the edges and corners (leaving the center calm for the card)
    clusters = [
        # Top-left corner cluster
        (100, 90, 75, (244, 114, 182, 190), (251, 207, 232, 220), 5, 0.2),
        (220, 120, 60, (192, 132, 252, 180), (243, 232, 255, 210), 6, 0.6),
        (80, 220, 65, (251, 113, 133, 175), (254, 226, 226, 210), 5, 1.1),
        (330, 90, 48, (236, 72, 153, 160), (252, 231, 243, 190), 5, 0.4),
        (160, 280, 52, (168, 85, 247, 165), (237, 233, 254, 200), 6, 0.9),

        # Top-right corner cluster
        (W - 120, 100, 80, (244, 114, 182, 200), (251, 207, 232, 230), 5, 0.4),
        (W - 240, 130, 65, (192, 132, 252, 185), (243, 232, 255, 215), 6, 0.8),
        (W - 100, 240, 70, (251, 113, 133, 180), (254, 226, 226, 210), 5, 1.3),
        (W - 350, 100, 50, (236, 72, 153, 160), (252, 231, 243, 190), 5, 0.5),
        (W - 180, 300, 55, (168, 85, 247, 170), (237, 233, 254, 200), 6, 1.0),

        # Bottom-left corner cluster
        (120, H - 110, 85, (251, 113, 133, 195), (254, 226, 226, 225), 5, 0.3),
        (250, H - 130, 68, (244, 114, 182, 185), (251, 207, 232, 215), 6, 0.7),
        (100, H - 240, 72, (192, 132, 252, 180), (243, 232, 255, 210), 5, 1.2),
        (370, H - 110, 50, (236, 72, 153, 160), (252, 231, 243, 190), 5, 0.6),
        (180, H - 310, 55, (168, 85, 247, 165), (237, 233, 254, 195), 6, 0.9),

        # Bottom-right corner cluster
        (W - 110, H - 110, 90, (244, 114, 182, 200), (251, 207, 232, 230), 5, 0.5),
        (W - 240, H - 140, 70, (192, 132, 252, 190), (243, 232, 255, 220), 6, 0.9),
        (W - 100, H - 250, 75, (251, 113, 133, 185), (254, 226, 226, 215), 5, 1.4),
        (W - 360, H - 120, 52, (236, 72, 153, 165), (252, 231, 243, 195), 5, 0.7),
        (W - 190, H - 320, 58, (168, 85, 247, 170), (237, 233, 254, 200), 6, 1.1),

        # Side gentle accents
        (60, H // 2 - 80, 55, (244, 114, 182, 160), (251, 207, 232, 190), 5, 0.8),
        (60, H // 2 + 100, 50, (192, 132, 252, 155), (243, 232, 255, 185), 6, 0.3),
        (W - 60, H // 2 - 90, 55, (251, 113, 133, 160), (254, 226, 226, 190), 5, 0.4),
        (W - 60, H // 2 + 110, 52, (244, 114, 182, 160), (251, 207, 232, 190), 6, 0.9),
    ]

    for cx, cy, rad, col1, col2, n_pet, rot in clusters:
        fl = draw_flower(cx, cy, rad, col1, col2, n_pet, rot)
        im = Image.alpha_composite(im, fl)

    # Scattered floating petals in mid-ground
    random.seed(42)
    petals_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(petals_layer)
    for _ in range(65):
        px = random.randint(30, W - 30)
        py = random.randint(30, H - 30)
        # Avoid center heavily
        if W * 0.33 < px < W * 0.67 and H * 0.22 < py < H * 0.78:
            if random.random() > 0.3:
                continue
        pr = random.randint(8, 22)
        p_col = random.choice([
            (244, 114, 182, random.randint(140, 210)),
            (251, 113, 133, random.randint(140, 210)),
            (192, 132, 252, random.randint(140, 210)),
            (251, 207, 232, random.randint(160, 230)),
        ])
        pd.ellipse([px - pr, py - pr // 2, px + pr, py + pr // 2], fill=p_col)
    
    petals_layer = petals_layer.filter(ImageFilter.GaussianBlur(radius=1.5))
    im = Image.alpha_composite(im, petals_layer)

    # Central gentle vignette to make sure center text is ultra-crisp
    vignette = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vignette)
    for r in range(480, 0, -20):
        alpha = int(90 * (1 - r / 480))
        vd.ellipse([W // 2 - r, H // 2 - r * 0.9, W // 2 + r, H // 2 + r * 0.9], fill=(8, 10, 20, alpha))
    vignette = vignette.filter(ImageFilter.GaussianBlur(radius=40))
    im = Image.alpha_composite(im, vignette)

    # Convert to RGB and save JPEG
    rgb_im = im.convert("RGB")
    rgb_im.save(filepath, "JPEG", quality=92)
    print("Generated floral wallpaper successfully at", filepath)

if __name__ == "__main__":
    generate_flower_wallpaper()

