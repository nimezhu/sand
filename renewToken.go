package sand

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"

	"golang.org/x/oauth2"
)

func getRefreshToken(email string) string {
	if v, ok := refreshTokenMap[email]; ok {
		return v
	}
	return ""
}

func RenewToken(config *oauth2.Config, tok *oauth2.Token, email string) *oauth2.Token {
	urlValue := url.Values{"client_id": {config.ClientID}, "client_secret": {config.ClientSecret}, "refresh_token": {getRefreshToken(email)}, "grant_type": {"refresh_token"}}
	resp, err := http.PostForm("https://www.googleapis.com/oauth2/v3/token", urlValue)
	if err != nil {
		log.Printf("Error when renew token %v\n", err)
	}
	body, err := ioutil.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		log.Println(err)
	}
	var refresh_token oauth2.Token
	json.Unmarshal([]byte(body), &refresh_token)
	tok.AccessToken = refresh_token.AccessToken
	tok.Expiry = refresh_token.Expiry
	return tok
}
