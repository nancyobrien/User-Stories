<%@ WebHandler Language="C#" Class="GetData" %>

using System;
using System.Web;

public class GetData : IHttpHandler, System.Web.SessionState.IReadOnlySessionState {
    
    public void ProcessRequest (HttpContext context) {
        string boardName = Stepframe.Common.GetRequestVar("id");
        string boardPath = String.Empty;
        string boardData = String.Empty;

        if (boardName == String.Empty && context.Session["boardName"] != null && context.Session["boardName"].ToString() != String.Empty) { boardName = context.Session["boardName"].ToString(); }
        
        if (boardName != String.Empty) {
            context.Session["boardName"] = boardName;

            boardPath = context.Server.MapPath(Stepframe.Common.GetAppSetting("boardPath") + boardName + ".json");
            boardData = Stepframe.FileUtilities.ReadFile(boardPath );
        }

        context.Response.ContentType = "application/json";
        context.Response.Write(boardData);
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }

}