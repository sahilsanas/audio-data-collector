sudo apt update
sudo apt install python3 python3-pip nginx -y
pip3 install flask

mkdir fileapp
cd fileapp
mkdir uploads

nano app.py

from flask import Flask, request, render_template_string, redirect, send_from_directory
import os

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

HTML = """
<h2>Cloud File Manager</h2>

<form method="POST" action="/upload" enctype="multipart/form-data">
  <input type="file" name="file">
  <button type="submit">Upload</button>
</form>

<h3>Files:</h3>
<ul>
{% for file in files %}
  <li>
    <a href="/files/{{file}}">{{file}}</a>
    <a href="/delete/{{file}}">Delete</a>
  </li>
{% endfor %}
</ul>
"""

@app.route("/")
def index():
    files = os.listdir(UPLOAD_FOLDER)
    return render_template_string(HTML, files=files)

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files["file"]
    file.save(os.path.join(UPLOAD_FOLDER, file.filename))
    return redirect("/")

@app.route("/files/<filename>")
def files(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route("/delete/<filename>")
def delete(filename):
    path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(path):
        os.remove(path)
    return redirect("/")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

python3 app.py

sudo nano /etc/nginx/sites-available/default

server {
    listen 80;

    location / {
        proxy_pass http://127.0.0.1:5000;
    }
}

sudo systemctl restart nginx

chmod 777 uploads









    
