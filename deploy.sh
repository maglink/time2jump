now=$(date)

git add .
git commit -am "$now"
git push origin

ssh root@178.62.180.160 'cd /test-game2 && git pull origin && git reset --hard && git checkout master && git reset --hard origin/master && npm install && grunt'
