import os
from dotenv import load_dotenv
import pymongo

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = pymongo.MongoClient(MONGO_URI)
db = client["aerosync_db"]
