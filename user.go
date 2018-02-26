package sand

type browserUser struct {
	Email        string `json:"email"`
	RefreshToken string `json:"refresh_token"`
	SheetID      string `json:"sheet_id"`
	Session      string `json:"session"`
}

//TODO update GSheet when Exits

//Recover from GSheet to Start Server

//Update Local Database

//Recover from local Database

//Event Driven
