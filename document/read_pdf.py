import sys
try:
    import PyPDF2
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2"])
    import PyPDF2

def read_pdf(file_path):
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ''
            for page in reader.pages:
                text += page.extract_text() + '\n'
            return text
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        print(f"--- CONTENT FOR {arg} ---")
        print(read_pdf(arg))
        print(f"--- END OF {arg} ---\n")
