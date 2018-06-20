package sand

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// Credentials which stores google ids.
type Credentials struct {
	Cid         string `json:"cid"`
	Csecret     string `json:"csecret"`
	RedirectURL string `json:"redirectUrl"`
	Admin       string `json:"admin"`
}

// user is a retrieved and authentiacted user.

type user struct {
	Sub           string `json:"sub"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Profile       string `json:"profile"`
	Picture       string `json:"picture"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Gender        string `json:"gender"`
}

var cred Credentials
var conf *oauth2.Config
var state string
var store = sessions.NewCookieStore([]byte("secret"))
var sessionID = "cnb007"
var admins = map[string]bool{}
var refreshTokenMap = map[string]string{}
var continueWeb = "/v1/main.html?config=continue"
var userSheetIDMap = map[string]string{}

func randToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}

/*InitCred init cred json for user using google sheet to store sessions.
 *   and adminirator to access admin pages.
 */
func InitCred(fn string) {
	file, err := ioutil.ReadFile(fn) //TODO
	if err != nil {
		log.Printf("File error: %v\n", err)
		os.Exit(1)
	}
	json.Unmarshal(file, &cred)
	conf = &oauth2.Config{
		ClientID:     cred.Cid,
		ClientSecret: cred.Csecret,
		RedirectURL:  cred.RedirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/spreadsheets",
		},
		Endpoint: google.Endpoint,
	}
	for _, v := range strings.Split(cred.Admin, ";") {
		admins[v] = true
	}
}
func init() {

}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, sessionID)
	fmt.Println(session.Values["state"])
	fmt.Println(session.Values["user"])
	v := session.Values["user"]
	w.Write([]byte(fmt.Sprintf("%s", v)))
}

func getLoginURL(state string) string {
	return conf.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

func authHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, sessionID)
	state0 := r.FormValue("state")
	if state != state0 {
		fmt.Printf("invalid oauth state, expected '%s', got '%s'\n", state, state0)
		http.Redirect(w, r, "/v1/main.html?config=continue", http.StatusTemporaryRedirect)
		return
	}

	code := r.FormValue("code")

	token, err := conf.Exchange(oauth2.NoContext, code)
	if err != nil {
		fmt.Println("Code exchange failed with \n", err)
		http.Redirect(w, r, "/v1/main.html?config=continue", http.StatusTemporaryRedirect)
		return
	}

	response, err := http.Get("https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		fmt.Println("Response failed with \n", err)
		http.Redirect(w, r, "/v1/main.html?config=continue", http.StatusTemporaryRedirect)
		return
	}
	defer response.Body.Close()
	contents, _ := ioutil.ReadAll(response.Body)

	session.Values["user"] = fmt.Sprintf("%s", contents)
	var user user
	err = json.Unmarshal(contents, &user)
	if err != nil {
		fmt.Println(err)
		return
	}
	session.Values["token"], _ = json.Marshal(token)
	if token.RefreshToken != "" {
		refreshTokenMap[user.Email] = token.RefreshToken
		//TODO add refresh token map to BoltDb
		refreshTokenBucket.Put([]byte(user.Email), []byte(token.RefreshToken))
		err2 := tx.Commit()
		if err2 != nil {
			log.Println("error in commit token", err2)
		}
	}
	//log.Println("token json", string(session.Values["token"].([]byte))) //TODO refresh?
	/* session sheetId replace by userSheetIdMap[user.Email]
	if v, ok := userSheetIdMap[user.Email]; ok {
		fmt.Println("saved id", v)
		session.Values["sheetId"] = v
	} else {
		fmt.Println("sheet id not set", user.Email)
	}
	*/
	session.Save(r, w)
	//fmt.Fprintf(w, "Content: %s\n", contents)
	http.Redirect(w, r, continueWeb, http.StatusTemporaryRedirect)
}
func addAuth(next func(w http.ResponseWriter, r *http.Request)) func(http.ResponseWriter, *http.Request) {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		session, _ := store.Get(r, sessionID)
		user := session.Values["user"]
		if user != nil {
			next(w, r)
		} else {
			w.Write([]byte("{}"))
		}
	})
}
func AddAuthHandler(next http.Handler) http.Handler {
	return addAuthHandler(next)
}
func addAuthHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Our middleware logic goes here...
		session, _ := store.Get(r, sessionID)
		user := session.Values["user"]
		if user != nil {
			next.ServeHTTP(w, r)
		} else {
			w.Write([]byte("need to login"))
			//TODO Redirect To Not Login
		}
	})
}
func checkAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Our middleware logic goes here...
		session, _ := store.Get(r, sessionID)
		user := session.Values["user"]
		if user != nil {
			next.ServeHTTP(w, r)
		} else {
			w.Write([]byte("{'error':'not login'}"))
		}
	})
}
func AdminAccess(next http.Handler) http.Handler {
	return addAdminHandler(next)
}
func addAdminHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		session, _ := store.Get(r, sessionID)
		userStr := session.Values["user"]
		var user user
		if userStr != nil {
			err := json.Unmarshal([]byte(userStr.(string)), &user)
			if err != nil {
				fmt.Println(err)
				w.Write([]byte("error in parse user profile"))
				return
			}
			if _, ok := admins[user.Email]; ok {
				next.ServeHTTP(w, r)
			} else {
				w.Write([]byte("need to be admin"))
			}
		} else {
			w.Write([]byte("need to login"))
		}
	})
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	state = randToken()
	session, _ := store.Get(r, sessionID)
	session.Values["state"] = state
	session.Save(r, w)
	w.Write([]byte("<html><title>Golang Google</title> <body style='display:none'><a href='" + getLoginURL(state) + "'><button id='myCheck'>Login with Google!</button> </a> </body><script>(function(){document.getElementById('myCheck').click();}())</script></html>"))
	//TODO  LOGIN BUTTON
}
func logoutHandler(w http.ResponseWriter, r *http.Request) {
	store.New(r, sessionID) //TODO FIX
	session, _ := store.Get(r, sessionID)
	for key := range session.Values {
		delete(session.Values, key)
	}
	session.Save(r, w)
	//w.Write([]byte("<html><head><title>Logout</title></head><body>Logout</body></html>"))
	//http.Redirect(w, r, continueWeb, http.StatusTemporaryRedirect)
	http.Redirect(w, r, "", http.StatusTemporaryRedirect)
	//TODO LOGOUT RIDIRECT
}
func userInfoHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, sessionID)
	userStr := session.Values["user"]
	if userStr != nil {
		w.Write([]byte(userStr.(string)))
	} else {
		w.Write([]byte("need to login"))
	}
}
func (s *Sand) addAuthTo(router *mux.Router) {
	router.HandleFunc("/profile", addAuth(indexHandler))
	router.HandleFunc("/login", loginHandler)
	router.HandleFunc("/logout", logoutHandler)
	router.HandleFunc("/auth/google/callback", authHandler)
	router.HandleFunc("/userinfo", userInfoHandler)
	addSheetTo(router)
	s.addSessionTo(router)
}
