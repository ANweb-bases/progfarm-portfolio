// ClipFlow — история буфера обмена. Сборка: build.bat (csc, .NET Framework 4, C# 5)
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows.Forms;

class Clip { public string Text; public bool Pin; public DateTime At = DateTime.Now; }

class MainForm : Form
{
    [DllImport("user32.dll")] static extern bool AddClipboardFormatListener(IntPtr h);
    [DllImport("user32.dll")] static extern bool RemoveClipboardFormatListener(IntPtr h);
    [DllImport("user32.dll")] static extern bool RegisterHotKey(IntPtr h, int id, uint mod, uint key);
    [DllImport("user32.dll")] static extern bool UnregisterHotKey(IntPtr h, int id);

    List<Clip> clips = new List<Clip>(); ListBox lb = new ListBox(); TextBox search = new TextBox(); CheckBox pause = new CheckBox();
    NotifyIcon tray = new NotifyIcon(); bool own, quit; Label hint = new Label();
    static string Dir { get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "ProgFarm", "ClipFlow"); } }
    string F { get { return Path.Combine(Dir, "history.txt"); } }
    static readonly Color Bg = Color.FromArgb(17, 19, 28), Panel_ = Color.FromArgb(29, 33, 47), Acc = Color.FromArgb(96, 165, 250);

    public MainForm()
    {
        Text = "ClipFlow — история буфера обмена"; Size = new Size(620, 640); MinimumSize = new Size(420, 400); StartPosition = FormStartPosition.CenterScreen;
        BackColor = Bg; ForeColor = Color.White; Font = new Font("Segoe UI", 10f);
        Icon ic = null; try { ic = new Icon(System.Reflection.Assembly.GetExecutingAssembly().GetManifestResourceStream("app.ico")); Icon = ic; } catch { }

        search.Dock = DockStyle.Top; search.Font = new Font("Segoe UI", 12f); search.BackColor = Panel_; search.ForeColor = Color.White; search.BorderStyle = BorderStyle.FixedSingle;
        search.TextChanged += (s, e) => Fill();
        var bar = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 46, Padding = new Padding(8, 6, 8, 0), BackColor = Bg };
        bar.Controls.Add(Btn("Копировать", (s, e) => Use())); bar.Controls.Add(Btn("Закрепить", (s, e) => PinSel())); bar.Controls.Add(Btn("Удалить", (s, e) => Del()));
        bar.Controls.Add(Btn("Очистить", (s, e) => { clips.RemoveAll(c => !c.Pin); Fill(); Save(); }));
        pause.Text = "Пауза"; pause.AutoSize = true; pause.Margin = new Padding(10, 8, 0, 0); bar.Controls.Add(pause);
        hint.Text = "Ctrl+Shift+V — показать окно · Enter — вернуть в буфер"; hint.Dock = DockStyle.Bottom; hint.Height = 24; hint.ForeColor = Color.Gray; hint.Padding = new Padding(10, 0, 0, 0);

        lb.Dock = DockStyle.Fill; lb.DrawMode = DrawMode.OwnerDrawFixed; lb.ItemHeight = 54; lb.BorderStyle = BorderStyle.None; lb.BackColor = Bg;
        lb.DrawItem += Draw; lb.DoubleClick += (s, e) => Use(); lb.KeyDown += (s, e) => { if (e.KeyCode == Keys.Enter) Use(); if (e.KeyCode == Keys.Delete) Del(); };
        Controls.Add(lb); Controls.Add(hint); Controls.Add(bar); Controls.Add(search);

        tray.Icon = ic ?? SystemIcons.Application; tray.Text = "ClipFlow"; tray.Visible = true;
        var m = new ContextMenuStrip(); m.Items.Add("Открыть", null, (s, e) => ShowMe()); m.Items.Add("Выход", null, (s, e) => { quit = true; Close(); });
        tray.ContextMenuStrip = m; tray.DoubleClick += (s, e) => ShowMe();
        LoadData(); Fill();
    }
    Button Btn(string t, EventHandler h) { var b = new Button { Text = t, Size = new Size(116, 32), FlatStyle = FlatStyle.Flat, BackColor = Panel_, ForeColor = Color.White, Cursor = Cursors.Hand }; b.FlatAppearance.BorderColor = Color.FromArgb(60, 66, 90); b.Click += h; return b; }
    void ShowMe() { Show(); WindowState = FormWindowState.Normal; Activate(); search.Focus(); }

    protected override void OnHandleCreated(EventArgs e) { base.OnHandleCreated(e); AddClipboardFormatListener(Handle); RegisterHotKey(Handle, 1, 0x6, 0x56); } // Ctrl+Shift+V
    protected override void OnHandleDestroyed(EventArgs e) { RemoveClipboardFormatListener(Handle); UnregisterHotKey(Handle, 1); base.OnHandleDestroyed(e); }
    protected override void WndProc(ref Message m)
    {
        if (m.Msg == 0x031D && !own && !pause.Checked) Grab();
        else if (m.Msg == 0x0312) ShowMe();
        base.WndProc(ref m);
    }
    protected override void OnFormClosing(FormClosingEventArgs e) { if (!quit && e.CloseReason == CloseReason.UserClosing) { e.Cancel = true; Hide(); } else tray.Visible = false; base.OnFormClosing(e); }

    void Grab()
    {
        try
        {
            if (!Clipboard.ContainsText()) return; var t = Clipboard.GetText(); if (string.IsNullOrWhiteSpace(t)) return;
            clips.RemoveAll(c => c.Text == t && !c.Pin); if (clips.Any(c => c.Text == t)) return;
            clips.Insert(0, new Clip { Text = t }); while (clips.Count(c => !c.Pin) > 100) clips.Remove(clips.Last(c => !c.Pin));
            Fill(); Save();
        }
        catch { }
    }
    List<Clip> View() { var q = search.Text.Trim().ToLower(); return clips.Where(c => q.Length == 0 || c.Text.ToLower().Contains(q)).OrderByDescending(c => c.Pin).ToList(); }
    void Fill() { var v = View(); lb.BeginUpdate(); lb.Items.Clear(); foreach (var c in v) lb.Items.Add(c); lb.EndUpdate(); }
    void Draw(object s, DrawItemEventArgs e)
    {
        if (e.Index < 0) return; var c = (Clip)lb.Items[e.Index]; bool sel = (e.State & DrawItemState.Selected) != 0;
        var r = Rectangle.Inflate(e.Bounds, -6, -3);
        using (var b = new SolidBrush(sel ? Color.FromArgb(40, 60, 100) : Panel_)) e.Graphics.FillRectangle(b, r);
        if (c.Pin) using (var b = new SolidBrush(Acc)) e.Graphics.FillRectangle(b, r.X, r.Y, 4, r.Height);
        var one = c.Text.Replace("\r", " ").Replace("\n", " ").Trim(); if (one.Length > 90) one = one.Substring(0, 90) + "…";
        e.Graphics.DrawString((c.Pin ? "★ " : "") + one, Font, Brushes.White, new RectangleF(r.X + 10, r.Y + 5, r.Width - 16, 22));
        using (var f = new Font("Segoe UI", 8f)) e.Graphics.DrawString(c.At.ToString("dd.MM HH:mm") + "  ·  " + c.Text.Length + " симв.", f, Brushes.Gray, r.X + 10, r.Y + 28);
    }
    Clip Sel() { return lb.SelectedItem as Clip; }
    void Use() { var c = Sel(); if (c == null) return; own = true; try { Clipboard.SetText(c.Text); } catch { } own = false; tray.ShowBalloonTip(800, "ClipFlow", "Скопировано в буфер", ToolTipIcon.None); }
    void PinSel() { var c = Sel(); if (c == null) return; c.Pin = !c.Pin; Fill(); Save(); }
    void Del() { var c = Sel(); if (c == null) return; clips.Remove(c); Fill(); Save(); }
    static string Esc(string s) { return s.Replace("\\", "\\\\").Replace("\r", "").Replace("\n", "\\n").Replace("\t", "\\t"); }
    static string Unesc(string s) { var o = new System.Text.StringBuilder(); for (int i = 0; i < s.Length; i++) { if (s[i] == '\\' && i + 1 < s.Length) { i++; o.Append(s[i] == 'n' ? '\n' : s[i] == 't' ? '\t' : s[i]); } else o.Append(s[i]); } return o.ToString(); }
    void Save() { try { Directory.CreateDirectory(Dir); File.WriteAllLines(F, clips.Select(c => (c.Pin ? "1" : "0") + "\t" + c.At.Ticks + "\t" + Esc(c.Text))); } catch { } }
    void LoadData()
    {
        try { if (File.Exists(F)) foreach (var l in File.ReadAllLines(F)) { var p = l.Split(new[] { '\t' }, 3); if (p.Length == 3) clips.Add(new Clip { Pin = p[0] == "1", At = new DateTime(long.Parse(p[1])), Text = Unesc(p[2]) }); } } catch { }
    }
}

static class Program { [System.Runtime.InteropServices.DllImport("user32.dll")] static extern bool SetProcessDPIAware();
    [STAThread] static void Main()
    {
        bool fresh; using (new System.Threading.Mutex(true, "ProgFarm.ClipFlow", out fresh)) { if (!fresh) return; try { SetProcessDPIAware(); } catch { } Application.EnableVisualStyles(); Application.Run(new MainForm()); }
    }
}
