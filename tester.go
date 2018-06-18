package sand

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func TesterMiddlewareFactory(testers map[string]bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			url := r.URL.Path
			if url == "/version" || url == "/login" || url == "/logout" || url == "/auth/google/callback" || url == "/profile" {
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
					w.Write([]byte("need to be granted testers"))
				}
			} else {
				http.Redirect(w, r, "/login", http.StatusTemporaryRedirect)
			}
		})
	}
}
