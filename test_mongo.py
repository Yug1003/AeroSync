from db.mongo_client import db

if __name__ == "__main__":
    collections = db.list_collection_names()
    print("Connected to MongoDB successfully!")
    print(f"Database name: {db.name}")
    print(f"Collections: {collections}")
