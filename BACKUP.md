VM1 → 10.0.1.0/24 → 10.0.1.10
VM2 → 10.0.2.0/24 → 10.0.2.10

on vm1
ssh-keygen -t rsa
on vm2
ssh-copy-id ubuntu@10.0.2.10

on vm2 
mkdir -p /home/ubuntu/backup

rsync -avz /home/ubuntu/data/ ubuntu@10.0.2.10:/home/ubuntu/backup/

crontab -e

*/5 * * * * rsync -avz /home/ubuntu/data/ ubuntu@10.0.2.10:/home/ubuntu/backup/

mkdir -p /home/ubuntu/data
echo "Hello Backup" > /home/ubuntu/data/file1.txt

rsync -avz /home/ubuntu/data/ ubuntu@10.0.2.10:/home/ubuntu/backup/

ls /home/ubuntu/backup
cat /home/ubuntu/backup/file1.txt
