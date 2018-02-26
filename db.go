package sand

import (
	"path"
	"time"

	"github.com/boltdb/bolt"
)

var sheetIDBucket *bolt.Bucket
var refreshTokenBucket *bolt.Bucket
var tx *bolt.Tx
var db *bolt.DB

func (s *Sand) initDb() error {
	fn := path.Join(s.Root, "user.db")
	db, err := bolt.Open(fn, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return err
	}
	tx, err = db.Begin(true)
	if err != nil {
		return err
	}
	sheetIDBucket, err = tx.CreateBucketIfNotExists([]byte("sheetID"))
	if err != nil {
		return err
	}
	sheetIDBucket.ForEach(func(k []byte, v []byte) error {
		userSheetIDMap[string(k)] = string(v)
		return nil
	})
	refreshTokenBucket, err = tx.CreateBucketIfNotExists([]byte("refreshToken"))
	if err != nil {
		return err
	}
	refreshTokenBucket.ForEach(func(k []byte, v []byte) error {
		refreshTokenMap[string(k)] = string(v)
		return nil
	})
	return nil
}
