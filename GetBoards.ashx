<%@ WebHandler Language="C#" Class="GetBoards" %>

using System;
using System.Web;
using System.Linq;
using System.IO;
using System.Collections.Generic;

public class GetBoards : IHttpHandler, System.Web.SessionState.IReadOnlySessionState {

    public void ProcessRequest(HttpContext context) {
        string boardPath = context.Server.MapPath(Stepframe.Common.GetAppSetting("boardPath"));
        List<Board> boards = new List<Board>();
        System.IO.DirectoryInfo di = new DirectoryInfo(boardPath);

        foreach (FileInfo file in di.GetFiles()) {
            boards.Add(new Board(file));
        }
        boards = boards.OrderByDescending(x => x.FileDate).ToList();  
        context.Response.ContentType = "application/json";
        context.Response.Write(Newtonsoft.Json.JsonConvert.SerializeObject(boards));

    }

    public bool IsReusable {
        get {
            return false;
        }
    }

}