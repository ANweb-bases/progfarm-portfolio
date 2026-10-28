// Копилка — учёт доходов и расходов. Сборка: build.bat (csc, .NET Framework 4, C# 5)
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Windows.Forms;

class Rec { public DateTime Date; public decimal Sum; public string Cat, Note; }   // Sum < 0 — расход

class Chart : Control
{
    public Dictionary<string, decimal> Data = new Dictionary<string, decimal>();
    static readonly Color[] Pal = { Color.FromArgb(251, 146, 60), Color.FromArgb(96, 165, 250), Color.FromArgb(74, 222, 128), Color.FromArgb(244, 114, 182), Color.FromArgb(250, 204, 21), Color.FromArgb(167, 139, 250), Color.FromArgb(148, 163, 184) };
    double prog = 1; Timer anim = new Timer { Interval = 16 };
    public Chart() { DoubleBuffered = true; BackColor = Color.FromArgb(24, 27, 39); anim.Tick += (s, e) => { prog += 0.06; if (prog >= 1) { prog = 1; anim.Stop(); } Invalidate(); }; }
    public void Animate() { prog = 0; anim.Start(); }
    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics; g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
        var list = Data.OrderByDescending(k => k.Value).ToList(); decimal max = list.Count == 0 ? 1 : list[0].Value, total = list.Sum(k => k.Value);
        if (list.Count == 0) { g.DrawString("Расходов в этом месяце нет", Font, Brushes.Gray, 12, 12); return; }
        int y = 10;
        using (var f = new Font("Segoe UI", 9f)) for (int i = 0; i < list.Count; i++)
        {
            g.DrawString(list[i].Key + "  " + (list[i].Value * 100 / total).ToString("0") + "%", f, Brushes.White, 12, y);
            int w = (int)((double)((Width - 40) * list[i].Value / max) * (1 - Math.Pow(1 - prog, 3)));
            using (var b = new SolidBrush(Pal[i % Pal.Length])) g.FillRectangle(b, 12, y + 20, Math.Max(w, 4), 12);
            g.DrawString(list[i].Value.ToString("N0") + " ₽", f, Brushes.Gray, Width - 80, y + 1);
            y += 46;
        }
    }
}

class MainForm : Form
{
    List<Rec> recs = new List<Rec>(); DateTime month = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
    DataGridView grid = new DataGridView(); Chart chart = new Chart(); Label lblMonth = new Label(), lblInc = new Label(), lblExp = new Label(), lblBal = new Label();
    TextBox sum = new TextBox(), note = new TextBox(); ComboBox cat = new ComboBox(), kind = new ComboBox();
    static readonly string[] Cats = { "Продукты", "Транспорт", "Жильё", "Здоровье", "Развлечения", "Одежда", "Подписки", "Другое" };
    static readonly Color Bg = Color.FromArgb(15, 17, 26), Pn = Color.FromArgb(24, 27, 39), Green = Color.FromArgb(74, 222, 128), Red = Color.FromArgb(251, 113, 133);
    static string Dir { get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "ProgFarm", "Kopilka"); } }
    string F { get { return Path.Combine(Dir, "records.txt"); } }
    static readonly CultureInfo Ru = new CultureInfo("ru-RU");

    public MainForm()
    {
        Fx.FadeIn(this); Text = "Копилка — учёт расходов"; Size = new Size(980, 640); MinimumSize = new Size(900, 560); StartPosition = FormStartPosition.CenterScreen;
        BackColor = Bg; ForeColor = Color.White; Font = new Font("Segoe UI", 10f);
        try { Icon = new Icon(System.Reflection.Assembly.GetExecutingAssembly().GetManifestResourceStream("app.ico")); } catch { }

        var top = new Panel { Dock = DockStyle.Top, Height = 64, Padding = new Padding(10) };
        var prev = Nav("◀", -1); var next = Nav("▶", 1); lblMonth.Font = new Font("Segoe UI", 16f, FontStyle.Bold); lblMonth.AutoSize = false; lblMonth.Size = new Size(240, 40); lblMonth.TextAlign = ContentAlignment.MiddleCenter;
        var fl = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = false }; fl.Controls.AddRange(new Control[] { prev, lblMonth, next });
        top.Controls.Add(fl);

        var form = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 50, Padding = new Padding(10, 6, 0, 0), WrapContents = false };
        kind.Items.AddRange(new object[] { "Расход", "Доход" }); kind.SelectedIndex = 0; kind.Width = 90; kind.DropDownStyle = ComboBoxStyle.DropDownList;
        sum.Width = 100; sum.Text = ""; cat.Items.AddRange(Cats); cat.SelectedIndex = 0; cat.Width = 130; cat.DropDownStyle = ComboBoxStyle.DropDownList; note.Width = 220;
        var add = new Button { Text = "Добавить", Size = new Size(110, 30), FlatStyle = FlatStyle.Flat, BackColor = Color.FromArgb(251, 146, 60), ForeColor = Color.Black, Cursor = Cursors.Hand }; add.FlatAppearance.BorderSize = 0; add.Click += (s, e) => Add(); AcceptButton = add;
        var csv = new Button { Text = "В Excel (CSV)", Size = new Size(120, 30), FlatStyle = FlatStyle.Flat, BackColor = Pn, ForeColor = Color.White }; csv.Click += (s, e) => Export();
        foreach (var c in new Control[] { kind, sum, cat, note, add, csv }) { c.Margin = new Padding(0, 0, 8, 0); form.Controls.Add(c); }
        sum.Tag = "Сумма"; note.Tag = "Заметка"; Hint(sum, "Сумма, ₽"); Hint(note, "Заметка");

        var stats = new TableLayoutPanel { Dock = DockStyle.Top, Height = 74, ColumnCount = 3, Padding = new Padding(10, 6, 10, 0) };
        for (int i = 0; i < 3; i++) stats.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.3f));
        foreach (var l in new[] { lblInc, lblExp, lblBal }) { l.Dock = DockStyle.Fill; l.BackColor = Pn; l.Font = new Font("Segoe UI", 13f, FontStyle.Bold); l.TextAlign = ContentAlignment.MiddleCenter; l.Margin = new Padding(4); stats.Controls.Add(l); }

        chart.Dock = DockStyle.Right; chart.Width = 330;
        grid.Dock = DockStyle.Fill; grid.BackgroundColor = Bg; grid.BorderStyle = BorderStyle.None; grid.EnableHeadersVisualStyles = false; grid.RowHeadersVisible = false; grid.AllowUserToAddRows = false; grid.ReadOnly = true; grid.SelectionMode = DataGridViewSelectionMode.FullRowSelect; grid.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
        grid.ColumnHeadersDefaultCellStyle.BackColor = Pn; grid.ColumnHeadersDefaultCellStyle.ForeColor = Color.Gray; grid.DefaultCellStyle.BackColor = Bg; grid.DefaultCellStyle.ForeColor = Color.White; grid.DefaultCellStyle.SelectionBackColor = Color.FromArgb(50, 56, 80); grid.GridColor = Pn; grid.RowTemplate.Height = 30; grid.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.DisableResizing; grid.ColumnHeadersHeight = 34;
        grid.Columns.Add("d", "Дата"); grid.Columns.Add("c", "Категория"); grid.Columns.Add("n", "Заметка"); grid.Columns.Add("s", "Сумма"); grid.Columns[3].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight;
        grid.KeyDown += (s, e) => { if (e.KeyCode == Keys.Delete) Del(); };
        var del = new Label { Dock = DockStyle.Bottom, Height = 26, Text = "  Выберите строку и нажмите Delete, чтобы удалить запись", ForeColor = Color.Gray };

        Controls.Add(grid); Controls.Add(del); Controls.Add(chart); Controls.Add(stats); Controls.Add(form); Controls.Add(top);
        LoadData(); Redraw();
    }
    Button Nav(string t, int d) { var b = new Button { Text = t, Size = new Size(44, 40), FlatStyle = FlatStyle.Flat, BackColor = Pn, ForeColor = Color.White, Cursor = Cursors.Hand }; b.Click += (s, e) => { month = month.AddMonths(d); Redraw(); }; return b; }
    static void Hint(TextBox t, string h)
    {
        t.ForeColor = Color.Gray; t.Text = h; t.Enter += (s, e) => { if (t.ForeColor == Color.Gray) { t.Text = ""; t.ForeColor = Color.Black; } };
        t.Leave += (s, e) => { if (t.Text.Length == 0) { t.ForeColor = Color.Gray; t.Text = h; } };
    }
    string Val(TextBox t) { return t.ForeColor == Color.Gray ? "" : t.Text.Trim(); }
    void Add()
    {
        decimal v; if (!decimal.TryParse(Val(sum).Replace(" ", "").Replace('.', ','), NumberStyles.Number, Ru, out v) || v <= 0) { MessageBox.Show("Введите сумму больше нуля"); return; }
        recs.Add(new Rec { Date = DateTime.Today, Sum = kind.SelectedIndex == 0 ? -v : v, Cat = kind.SelectedIndex == 0 ? (string)cat.SelectedItem : "Доход", Note = Val(note) });
        sum.ForeColor = Color.Black; sum.Clear(); note.ForeColor = Color.Black; note.Clear(); Save(); Redraw(); sum.Focus();
    }
    List<Rec> Cur() { return recs.Where(r => r.Date.Year == month.Year && r.Date.Month == month.Month).OrderByDescending(r => r.Date).ToList(); }
    void Redraw()
    {
        var mn = Ru.DateTimeFormat.MonthNames[month.Month - 1]; lblMonth.Text = char.ToUpper(mn[0]) + mn.Substring(1) + " " + month.Year; var cur = Cur(); grid.Rows.Clear();
        foreach (var r in cur) { int i = grid.Rows.Add(r.Date.ToString("dd.MM"), r.Cat, r.Note, r.Sum.ToString("N0") + " ₽"); grid.Rows[i].Tag = r; grid.Rows[i].Cells[3].Style.ForeColor = r.Sum < 0 ? Red : Green; }
        decimal inc = cur.Where(r => r.Sum > 0).Sum(r => r.Sum), exp = -cur.Where(r => r.Sum < 0).Sum(r => r.Sum);
        lblInc.Text = "Доходы\n" + inc.ToString("N0") + " ₽"; lblInc.ForeColor = Green; lblExp.Text = "Расходы\n" + exp.ToString("N0") + " ₽"; lblExp.ForeColor = Red;
        lblBal.Text = "Баланс\n" + (inc - exp).ToString("N0") + " ₽"; lblBal.ForeColor = inc - exp >= 0 ? Color.White : Red;
        chart.Data = cur.Where(r => r.Sum < 0).GroupBy(r => r.Cat).ToDictionary(g => g.Key, g => -g.Sum(r => r.Sum)); chart.Animate();
    }
    void Del() { if (grid.CurrentRow == null) return; var r = grid.CurrentRow.Tag as Rec; if (r != null) { recs.Remove(r); Save(); Redraw(); } }
    void Export()
    {
        using (var d = new SaveFileDialog { Filter = "CSV|*.csv", FileName = "kopilka-" + month.ToString("yyyy-MM") + ".csv" })
            if (d.ShowDialog() == DialogResult.OK) File.WriteAllLines(d.FileName, new[] { "Дата;Категория;Заметка;Сумма" }.Concat(Cur().Select(r => r.Date.ToString("dd.MM.yyyy") + ";" + r.Cat + ";" + (r.Note ?? "").Replace(";", ",") + ";" + r.Sum)), System.Text.Encoding.UTF8);
    }
    void Save() { try { Directory.CreateDirectory(Dir); File.WriteAllLines(F, recs.Select(r => r.Date.ToString("yyyy-MM-dd") + "\t" + r.Sum.ToString(CultureInfo.InvariantCulture) + "\t" + r.Cat + "\t" + (r.Note ?? "").Replace("\t", " "))); } catch { } }
    void LoadData()
    {
        try { if (File.Exists(F)) foreach (var l in File.ReadAllLines(F)) { var p = l.Split('\t'); if (p.Length >= 3) recs.Add(new Rec { Date = DateTime.ParseExact(p[0], "yyyy-MM-dd", CultureInfo.InvariantCulture), Sum = decimal.Parse(p[1], CultureInfo.InvariantCulture), Cat = p[2], Note = p.Length > 3 ? p[3] : "" }); } } catch { }
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
