from flask import Flask, render_template
import os
from dotenv import load_dotenv


load_dotenv()

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    
    port = int(os.environ.get('PORT', 5000))
    
    host = os.environ.get('HOST', '0.0.0.0')
    app.run(host=host, port=port, debug=False)  