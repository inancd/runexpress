#!/bin/bash

#chmod +x restartServer.sh

# Display PM2 status
echo "Checking PM2 status..."
pm2 status
sleep 2

# Stop the server using PM2
echo "Stopping the server..."
pm2 stop server
sleep 2

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx
sleep 2

# Start the server using PM2
echo "Starting the server..."
pm2 start server
sleep 2

echo "Server restart complete."

#./restartServer.sh