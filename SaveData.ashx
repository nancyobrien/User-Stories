<%@ WebHandler Language="C#" Class="SaveData" %>

using System;
using System.Web;

public class SaveData : IHttpHandler, System.Web.SessionState.IReadOnlySessionState {
    
    public void ProcessRequest (HttpContext context) {
        string boardData = Stepframe.Common.GetRequestVar("data");
        string boardName = Stepframe.Common.GetRequestVar("name");
        string boardPath = String.Empty;

        if (boardData != String.Empty) {
            if (boardName == String.Empty) {
                boardName = Guid.NewGuid().ToString("N");  //GUID - no hyphens
            }
            boardPath = context.Server.MapPath(Stepframe.Common.GetAppSetting("boardPath") + boardName + ".json");
            Stepframe.FileUtilities.WriteFile(boardPath, boardData);
        }

        context.Response.ContentType = "text/plain";
        context.Response.Write(boardName);
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }

}