sudo apt update
sudo apt install nginx -y

sudo systemctl start nginx
sudo systemctl enable nginx

echo "<h1>My Cloud Web App is Running</h1>" | sudo tee /var/www/html/index.html

bash <(curl -Ss https://my-netdata.io/kickstart.sh)

http://<PUBLIC_IP>:19999

sudo apt install stress -y

stress --cpu 2 --timeout 60

