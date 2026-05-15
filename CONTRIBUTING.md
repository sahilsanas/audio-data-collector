sudo apt update && sudo apt upgrade -y

sudo apt install nginx -y

sudo systemctl enable nginx
sudo systemctl start nginx

sudo systemctl status nginx

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

sudo mkdir -p /var/www/static-site

sudo nano /var/www/static-site/index.html

<!DOCTYPE html>
<html>
<head>
    <title>Cloud Static Website</title>
    <style>
        body {
            font-family: Arial;
            text-align: center;
            margin-top: 100px;
            background: #f4f4f4;
        }

        h1 {
            color: #0077cc;
        }
    </style>
</head>
<body>
    <h1>Static Website Hosted on Cloud VM</h1>
    <p>Deployment Successful 🚀</p>
</body>
</html>

sudo nano /etc/nginx/sites-available/static-site

server {
    listen 80;
    server_name _;

    root /var/www/static-site;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}

sudo ln -s /etc/nginx/sites-available/static-site /etc/nginx/sites-enabled/

sudo rm /etc/nginx/sites-enabled/default

sudo nginx -t

sudo systemctl restart nginx

scp -i your-key.pem index.html ubuntu@YOUR_PUBLIC_IP:/tmp

sudo mv /tmp/index.html /var/www/static-site/
