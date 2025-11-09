# Hostel Images Setup Guide

## Required Images

Add the following hostel images to the `frontend/public/` folder:

1. **cv-raman.jpg** - C.V Raman Hostel
2. **jc-bose.jpg** - J.C Bose Hostel
3. **kalpana-chawla.jpg** - Kalpana Chawla Hostel
4. **aryabhatta.jpg** - Aryabhatta Hostel
5. **apj-kalam.jpg** - A.P.J Abdul Kalam Hostel
6. **anandi-joshi.jpg** - Dr. Anandi Gopal Joshi Hostel
7. **homi-bhabha.jpg** - Homi J. Bhabha Hostel
8. **vg-bhide.jpg** - V.G Bhide Hostel
9. **ramanujan.jpg** - S. Ramanujan Hostel

## Image Specifications

- **Format:** JPG or PNG
- **Recommended size:** 800x600 pixels or larger
- **Aspect ratio:** 4:3 or 16:9 works best
- **File names:** Must match exactly (lowercase, with hyphens)

## How to Add Images

### Method 1: Using Finder (Mac)
1. Save your hostel photos with the exact names above
2. Open Finder and navigate to your project folder
3. Go to `SYNHACK2/frontend/public/`
4. Copy/paste or drag-drop all hostel images there

### Method 2: Using Terminal
```bash
# If images are in Downloads folder
cp ~/Downloads/cv-raman.jpg frontend/public/
cp ~/Downloads/jc-bose.jpg frontend/public/
# ... repeat for all images
```

### Method 3: Using VS Code/Kiro IDE
1. Right-click on `frontend/public/` folder in the file explorer
2. Click "Reveal in Finder"
3. Drag and drop your images into that folder

## Placeholder Images

Until you add real images, the carousel will show a purple gradient placeholder with the hostel name.

## Verify Images

After adding images, check they exist:
```bash
ls -lh frontend/public/*.jpg
```

You should see all 9 hostel images listed.
