// HabitFlow — трекер привычек. Сборка: build.bat (csc, .NET Framework 4, C# 5)
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Linq;
using System.Windows.Forms;

class Habit { public string Name; public HashSet<string> Days = new HashSet<string>(); }

class HabitList : Control
{
    public List<Habit> Items = new List<Habit>();
    public event Action Changed;
    const int RowH = 70, Sq = 24, Gap = 6, N = 14;
    Dictionary<string, DateTime> pulse = new Dictionary<string, DateTime>(); Timer anim = new Timer { Interval = 16 };
    int hRow = -1, hSq = -2; // hSq: -1 = delete button, 0..N-1 = day square
    static readonly Color Card = Color.FromArgb(30, 34, 48), Off = Color.FromArgb(48, 53, 74), Ok = Color.FromArgb(74, 222, 128), Hot = Color.FromArgb(255, 159, 67);

    public HabitList()
    {
        DoubleBuffered = true; BackColor = Color.FromArgb(16, 18, 26);
        anim.Tick += (s, e) => { var now = DateTime.Now; foreach (var k in pulse.Where(x => (now - x.Value).TotalMilliseconds > 380).Select(x => x.Key).ToList()) pulse.Remove(k); Invalidate(); if (pulse.Count == 0) anim.Stop(); };
    }
    public static string Key(DateTime d) { return d.ToString("yyyy-MM-dd"); }
    public static int Streak(Habit h)
    {
        int s = 0; var d = DateTime.Today;
        if (!h.Days.Contains(Key(d))) d = d.AddDays(-1);
        while (h.Days.Contains(Key(d))) { s++; d = d.AddDays(-1); }
        return s;
    }
    public void Relayout() { Height = Math.Max(Items.Count * RowH + 10, 10); Invalidate(); }
    Rectangle SqRect(int row, int i) { return new Rectangle(Width - 58 - (N - i) * (Sq + Gap) + Gap, row * RowH + 5 + (RowH - 10 - Sq) / 2 + 8, Sq, Sq); }
    Rectangle DelRect(int row) { return new Rectangle(Width - 44, row * RowH + 5 + (RowH - 10) / 2 - 12, 28, 24); }

    static GraphicsPath Round(Rectangle r, int rad)
    {
        var p = new GraphicsPath(); int d = rad * 2;
        p.AddArc(r.X, r.Y, d, d, 180, 90); p.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90); p.AddArc(r.X, r.Bottom - d, d, d, 90, 90); p.CloseFigure(); return p;
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics; g.SmoothingMode = SmoothingMode.AntiAlias; g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
        using (var nf = new Font("Segoe UI", 12f, FontStyle.Bold)) using (var sf = new Font("Segoe UI", 9f)) using (var dn = new Font("Segoe UI", 7f))
        for (int r = 0; r < Items.Count; r++)
        {
            var h = Items[r]; var card = new Rectangle(8, r * RowH + 5, Width - 16, RowH - 10);
            using (var p = Round(card, 12)) using (var b = new SolidBrush(r == hRow ? Color.FromArgb(36, 41, 58) : Card)) g.FillPath(b, p);
            int s = Streak(h);
            g.DrawString(h.Name, nf, Brushes.White, 22, card.Y + 8);
            using (var b = new SolidBrush(s > 0 ? Hot : Color.Gray)) g.DrawString(s > 0 ? "Серия: " + s + " дн." : "Начните сегодня", sf, b, 23, card.Y + 34);
            for (int i = 0; i < N; i++)
            {
                var d = DateTime.Today.AddDays(i - (N - 1)); var rc = SqRect(r, i); bool on = h.Days.Contains(Key(d));
                DateTime t0; if (pulse.TryGetValue(r + ":" + i, out t0)) { int gr = (int)(Math.Sin(Math.PI * Math.Min(1, (DateTime.Now - t0).TotalMilliseconds / 380)) * 5); rc.Inflate(gr, gr); }
                using (var p = Round(rc, 6)) using (var b = new SolidBrush(on ? Ok : Off)) g.FillPath(b, p);
                if (i == N - 1) using (var p = Round(rc, 6)) using (var pen = new Pen(Color.White, 1.5f)) g.DrawPath(pen, p);
                if (r == hRow && i == hSq) using (var p = Round(rc, 6)) using (var pen = new Pen(Ok, 2)) g.DrawPath(pen, p);
                g.DrawString(d.Day.ToString(), dn, Brushes.Gray, rc.X + (Sq - g.MeasureString(d.Day.ToString(), dn).Width) / 2 + 1, rc.Y - 13);
            }
            var x = DelRect(r);
            using (var b = new SolidBrush(r == hRow && hSq == -1 ? Color.FromArgb(255, 99, 99) : Color.Gray)) g.DrawString("×", nf, b, x.X + 4, x.Y - 3);
        }
        if (Items.Count == 0) using (var f0 = new Font("Segoe UI", 9f)) g.DrawString("Добавьте первую привычку выше", f0, Brushes.Gray, 20, 20);
    }

    void Hit(Point pt, out int row, out int sq)
    {
        row = pt.Y / RowH; sq = -2; if (row >= Items.Count) { row = -1; return; }
        if (DelRect(row).Contains(pt)) { sq = -1; return; }
        for (int i = 0; i < N; i++) if (SqRect(row, i).Contains(pt)) { sq = i; return; }
    }
    protected override void OnMouseMove(MouseEventArgs e)
    {
        int r, s; Hit(e.Location, out r, out s);
        if (r != hRow || s != hSq) { hRow = r; hSq = s; Invalidate(); }
        Cursor = s != -2 ? Cursors.Hand : Cursors.Default;
    }
    protected override void OnMouseLeave(EventArgs e) { hRow = -1; hSq = -2; Invalidate(); }
    protected override void OnMouseDown(MouseEventArgs e)
    {
        int r, s; Hit(e.Location, out r, out s); if (r < 0 || s == -2) return;
        if (s == -1) { if (MessageBox.Show("Удалить привычку «" + Items[r].Name + "»?", "HabitFlow", MessageBoxButtons.YesNo) == DialogResult.Yes) Items.RemoveAt(r); pulse.Clear(); }
        else { var k = Key(DateTime.Today.AddDays(s - (N - 1))); if (!Items[r].Days.Remove(k)) Items[r].Days.Add(k); pulse[r + ":" + s] = DateTime.Now; anim.Start(); }
        hRow = -1; Relayout(); if (Changed != null) Changed();
    }
}

class MainForm : Form
{
    HabitList list = new HabitList(); TextBox box = new TextBox(); Label status = new Label(); Panel host = new Panel();
    static string Dir { get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "ProgFarm", "HabitFlow"); } }
    string File_ { get { return Path.Combine(Dir, "habits.txt"); } }

    public MainForm()
    {
        Fx.FadeIn(this); Text = "HabitFlow — трекер привычек"; Size = new Size(780, 600); MinimumSize = new Size(640, 400);
        BackColor = Color.FromArgb(16, 18, 26); ForeColor = Color.White; Font = new Font("Segoe UI", 10f); StartPosition = FormStartPosition.CenterScreen;
        try { Icon = new Icon(System.Reflection.Assembly.GetExecutingAssembly().GetManifestResourceStream("app.ico")); } catch { }
        var title = new Label { Text = "HabitFlow", Font = new Font("Segoe UI", 20f, FontStyle.Bold), ForeColor = Color.FromArgb(74, 222, 128), AutoSize = true, Location = new Point(18, 12) };
        var sub = new Label { Text = "Отмечайте дни кликом по квадратикам. Сегодня — с белой рамкой.", ForeColor = Color.Gray, AutoSize = true, Location = new Point(20, 58) };
        box.Location = new Point(20, 90); box.Width = 520; box.Font = new Font("Segoe UI", 12f); box.BackColor = Color.FromArgb(30, 34, 48); box.ForeColor = Color.White; box.BorderStyle = BorderStyle.FixedSingle;
        box.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
        var add = new Button { Text = "Добавить", Location = new Point(550, 88), Size = new Size(120, 34), FlatStyle = FlatStyle.Flat, BackColor = Color.FromArgb(74, 222, 128), ForeColor = Color.Black, Anchor = AnchorStyles.Top | AnchorStyles.Right, Cursor = Cursors.Hand };
        add.FlatAppearance.BorderSize = 0; add.Click += (s, e) => Add(); AcceptButton = add;
        host.Location = new Point(10, 136); host.Size = new Size(ClientSize.Width - 20, ClientSize.Height - 175); host.AutoScroll = true; host.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
        host.Controls.Add(list); list.Width = host.ClientSize.Width - 4; host.Resize += (s, e) => { list.Width = host.ClientSize.Width - 4; list.Relayout(); };
        status.Dock = DockStyle.Bottom; status.Height = 32; status.TextAlign = ContentAlignment.MiddleLeft; status.Padding = new Padding(18, 0, 0, 0); status.ForeColor = Color.Gray;
        Controls.AddRange(new Control[] { title, sub, box, add, host, status });
        list.Changed += () => { Save(); Stat(); }; LoadData(); list.Relayout(); Stat();
    }
    void Add() { var n = box.Text.Trim(); if (n.Length == 0) return; list.Items.Add(new Habit { Name = n }); box.Clear(); list.Relayout(); Save(); Stat(); }
    void Stat()
    {
        int t = list.Items.Count, d = list.Items.Count(h => h.Days.Contains(HabitList.Key(DateTime.Today))), best = t == 0 ? 0 : list.Items.Max(h => HabitList.Streak(h));
        status.Text = "Сегодня выполнено: " + d + " из " + t + "     Лучшая серия: " + best + " дн.";
    }
    void Save() { try { Directory.CreateDirectory(Dir); File.WriteAllLines(File_, list.Items.Select(h => h.Name.Replace("\t", " ") + "\t" + string.Join(",", h.Days))); } catch { } }
    void LoadData()
    {
        try { if (!File.Exists(File_)) return; foreach (var l in File.ReadAllLines(File_)) { var p = l.Split('\t'); var h = new Habit { Name = p[0] }; if (p.Length > 1) foreach (var d in p[1].Split(',')) if (d.Length > 0) h.Days.Add(d); list.Items.Add(h); } } catch { }
    }
}


static class Fx
{
    // плавное появление окна при запуске
    public static void FadeIn(Form f)
    {
        f.Opacity = 0; var t = new Timer { Interval = 15 };
        t.Tick += (s, e) => { f.Opacity += 0.1; if (f.Opacity >= 1) { f.Opacity = 1; t.Stop(); t.Dispose(); } };
        f.Shown += (s, e) => t.Start();
    }
}

static class Program { [System.Runtime.InteropServices.DllImport("user32.dll")] static extern bool SetProcessDPIAware(); [STAThread] static void Main() { try { SetProcessDPIAware(); } catch { } Application.EnableVisualStyles(); Application.Run(new MainForm()); } }
