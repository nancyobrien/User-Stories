using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

/// <summary>
/// Summary description for Board
/// </summary>
public class Board
{
    public string Link {
        get {
            return Stepframe.Common.GetAppSetting("boardPath").Replace("~", String.Empty) + this.Name;
        }
    }
    public string Name { get; set; }
    public DateTime FileDate { get; set; }
    public string DisplayDate {
        get {
            return this.FileDate.ToString("MM/dd/yyyy");
        }
    }
	public Board()
	{
		//
		// TODO: Add constructor logic here
		//
	}

    public Board(FileInfo fi) {
        this.Name = fi.Name;
        this.FileDate = fi.LastWriteTime;
    }
}