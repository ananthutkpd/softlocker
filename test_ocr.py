from PIL import Image, ImageDraw
import pytesseract

# Create an image with text
img = Image.new('RGB', (400, 200), color=(255, 255, 255))
d = ImageDraw.Draw(img)
d.text((10,10), "This is an invoice bill total amount due 500", fill=(0,0,0))
img.save('test_invoice.jpg')

text = pytesseract.image_to_string(Image.open('test_invoice.jpg'))
print("Extracted text:")
print(text.strip())

