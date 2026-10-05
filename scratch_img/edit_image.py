import cv2
import pytesseract
from pytesseract import Output
import numpy as np

# Load the image
image_path = 'img1.png'
img = cv2.imread(image_path)
if img is None:
    print("Could not read img1.png, trying img2.png")
    image_path = 'img2.png'
    img = cv2.imread(image_path)

if img is None:
    print("Could not read images.")
    exit(1)

# Ensure tesseract is configured if needed. In standard environments it's in PATH.
try:
    d = pytesseract.image_to_data(img, output_type=Output.DICT)
    n_boxes = len(d['text'])
    
    found = False
    for i in range(n_boxes):
        text = d['text'][i].strip()
        if '49' in text:
            # Check context to see if it's near "Features" or just 49 alone
            # For safety, let's look at the bounding box
            (x, y, w, h) = (d['left'][i], d['top'][i], d['width'][i], d['height'][i])
            print(f"Found '49' at x:{x}, y:{y}, w:{w}, h:{h}")
            
            # The background is a specific color. Let's sample a pixel just outside the text
            # E.g., y-5, x-5
            bg_color = img[max(0, y-5), max(0, x-5)].tolist()
            
            # Draw a filled rectangle over the original text to erase it
            cv2.rectangle(img, (x, y), (x + w, y + h), bg_color, -1)
            
            # Put the text "50" in its place
            # Use OpenCV's putText
            cv2.putText(img, '50', (x, y + h - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)
            found = True

    if found:
        output_path = 'Architecture_Final_V4.png'
        cv2.imwrite(output_path, img)
        print(f"Successfully modified and saved to {output_path}")
    else:
        print("Could not find text '49' in the image.")
except Exception as e:
    print(f"Error: {e}")
