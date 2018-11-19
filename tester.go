package sand

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
)

var urlMatch = regexp.MustCompile("/static/image/*")

func TesterMiddlewareFactory(testers map[string]bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			url := r.URL.Path
			/* TODO
			   Users
				 Sign Up System
			*/
			if url == "/static/favicon.ico" || url == "/favicon.ico" || url == "" || url == "/" || url == "/static/main.html" || url == "/version" || url == "/login" || url == "/logout" || url == "/auth/google/callback" || url == "/profile" || urlMatch.Match([]byte(url)) {
				next.ServeHTTP(w, r)
				return
			}
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
				if _, ok := testers[user.Email]; ok {
					next.ServeHTTP(w, r)
				} else {
					w.Write([]byte("<html><head></head><body><div>CNB is now under alpha testing. It is only open for testers. Please contact zhuxp@cmu.edu for further information.</div> <div><a href='/logout'>Log Out</a></div></body></html>"))
				}
			} else {
				next.ServeHTTP(w, r) //TODO
				//http.Redirect(w, r, "/login", http.StatusTemporaryRedirect)
			}
		})
	}
}
