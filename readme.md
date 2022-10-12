# setup

    npm install promise-mysql

# sql setup
create new sql instance in google cloud console
connect using 
    gcloud sql connect homestay-demo --user=root
input commands in sql_setup.md

# see sql settings
run 
    gcloud sql instances describe homestay-demo
connection name
    xenon-monitor-193415:us-central1:homestay-demo

# cloud run (node)
go to cloud run
create new instance
add a connection to the sql instance

    gcloud config set project PROJECT_ID
overwrite the new instance with 
    
    gcloud run deploy

