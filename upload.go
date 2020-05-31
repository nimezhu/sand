package sand

import (
	"encoding/json"
	"io"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path"
	"time"

	"github.com/gorilla/mux"
)

var userCurrentSession map[string]string

func init() {
	rand.Seed(time.Now().UnixNano())
	userCurrentSession = make(map[string]string)
}

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func randStringRunes(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}
func (s *Sand) upload(w http.ResponseWriter, req *http.Request) { //should be share session.
	all, _ := ioutil.ReadAll(req.Body)
	n := randStringRunes(32)
	defer req.Body.Close()
	fn := path.Join(s.Root, "sessions", n) //TODO
	err := ioutil.WriteFile(fn, all, 0644)
	if err != nil {
		io.WriteString(w, "error")
	} else {
		log.Println("create session " + n)
		io.WriteString(w, n)
	}
	/* NO MORE REMOVE SESSION, REMOVE SESSION BY OTHER PROGRAM
	go func() {
		time.Sleep(time.Second * 60 * 60 * 24 * 180)
		os.Remove(fn)
		log.Println("remove session" + n)
	}()
	*/
}

func (s *Sand) setUserSession(w http.ResponseWriter, req *http.Request) { //should be share session.
	all, _ := ioutil.ReadAll(req.Body)
	defer req.Body.Close()
	n := randStringRunes(32)
	//map
	session, _ := store2.Get(req, sessionID)
	userStr := session.Values["user"]
	var user user
	if userStr != nil {
		err := json.Unmarshal([]byte(userStr.(string)), &user)
		//TODO
		if err == nil {
			if v, ok := userCurrentSession[user.Email]; ok {
				fn := path.Join(s.Root, "sessions", v)
				os.Remove(fn)
				log.Println("remove session" + v + " from user " + user.Email)
			}
			newfn := path.Join(s.Root, "sessions", n)
			err := ioutil.WriteFile(newfn, all, 0644)
			if err != nil {
				io.WriteString(w, "error")
			} else {
				log.Println("create session " + n)
				io.WriteString(w, n)
				userCurrentSession[user.Email] = n
			}
		}
	}
}
func getUserSession(w http.ResponseWriter, req *http.Request) {
	session, _ := store2.Get(req, sessionID)
	userStr := session.Values["user"]
	var user user
	if userStr != nil {
		err := json.Unmarshal([]byte(userStr.(string)), &user)
		if err == nil {
			if v, ok := userCurrentSession[user.Email]; ok {
				w.Write([]byte("{id:\"" + v + "\"}"))

			} else {
				w.Write([]byte("{error:\"none\"}"))
			}
		} else {
			w.Write([]byte("{error:\"parsing\"}"))
		}
	}
}

func (s *Sand) addSessionTo(router *mux.Router) {
	router.Handle("/getsession", checkAuth(http.HandlerFunc(getUserSession)))                                                   //get user session
	router.Handle("/setsession", checkAuth(http.HandlerFunc(s.setUserSession)))                                                 //set user session
	router.PathPrefix("/share/").Handler(http.StripPrefix("/share/", http.FileServer(http.Dir(path.Join(s.Root, "sessions"))))) //TODO
	router.HandleFunc("/upload", s.upload)
}
