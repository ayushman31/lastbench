to run this 

- download awscli
- verify : aws --version
- start seaweedfs : docker compose up -d seaweedfs
- in ./aws create credentials (no extension) and add :
    [seaweedfs]
    aws_access_key_id = seaweedfs_access_key
    aws_secret_access_key = seaweedfs_secret_key
- to create bucket run :
    aws --endpoint-url http://localhost:8333 --profile seaweedfs s3 mb s3://lastbench-recordings
- verify : aws --profile seaweedfs --endpoint-url http://localhost:8333 s3 ls

- optionally create config in ./aws and add :
    [profile seaweedfs]
    region = us-east-1  //seaweed requires this so add this just to keep it happy
    output = json

- to check recordings : aws --profile seaweedfs --endpoint-url http://localhost:8333 s3 ls s3://lastbench-recordings/recordings/     (this would give users)