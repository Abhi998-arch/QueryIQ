
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const STATUS_NAMES = ["Pending", "In Progress", "Resolved"];

function App() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [queries, setQueries] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const [historySearch, setHistorySearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  async function loadQueries() {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const response = await fetch(`${API_URL}/queries?limit=50`);

      if (!response.ok) {
        throw new Error("Unable to load query history.");
      }

      const data = await response.json();
      setQueries(data.queries || []);
    } catch (err) {
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadAnalytics() {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      const response = await fetch(`${API_URL}/analytics`);

      if (!response.ok) {
        throw new Error("Unable to load analytics.");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setAnalyticsError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function refreshDashboard() {
    await Promise.all([loadQueries(), loadAnalytics()]);
  }

  useEffect(() => {
    refreshDashboard();
  }, []);

  async function classifyQuery(event) {
    event.preventDefault();

    if (!query.trim()) {
      setError("Please enter a customer query.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Classification failed.");
      }

      setResult(data);
      setQuery("");
      await refreshDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      setUpdatingStatus(id);
      setHistoryError("");

      const response = await fetch(
        `${API_URL}/queries/${id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not update query status.");
      }

      setQueries((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, status: data.status } : item
        )
      );

      await loadAnalytics();
    } catch (err) {
      setHistoryError(err.message);
    } finally {
      setUpdatingStatus(null);
    }
  }

  function formatDate(date) {
    if (!date) return "—";
    return new Date(date.replace(" ", "T") + "Z").toLocaleString();
  }

  const categoryData = analytics?.category_distribution || [];
  const departmentData = analytics?.department_distribution || [];
  const statusData = analytics?.status_distribution || [];

  function getStatusCount(status) {
    const item = statusData.find((entry) => entry.status === status);
    return item?.count ?? 0;
  }

  function getStatusPercentage(status) {
    const item = statusData.find((entry) => entry.status === status);
    return item?.percentage ?? 0;
  }

  const categories = [...new Set(queries.map((item) => item.category))];

  const filteredQueries = queries.filter((item) => {
    const search = historySearch.toLowerCase().trim();

    const matchesSearch =
      !search ||
      item.query?.toLowerCase().includes(search) ||
      item.category?.toLowerCase().includes(search) ||
      item.department?.toLowerCase().includes(search);

    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  function clearHistoryFilters() {
    setHistorySearch("");
    setCategoryFilter("All");
  }

  const statusCards = [
    {
      label: "Pending Queries",
      value: getStatusCount("Pending"),
      description: "Awaiting attention",
      symbol: "◷",
    },
    {
      label: "In Progress",
      value: getStatusCount("In Progress"),
      description: "Currently being handled",
      symbol: "↻",
    },
    {
      label: "Resolved Queries",
      value: getStatusCount("Resolved"),
      description: "Successfully completed",
      symbol: "✓",
    },
    {
      label: "Resolution Rate",
      value: `${analytics?.resolution_rate ?? 0}%`,
      description: "Queries successfully resolved",
      symbol: "%",
    },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">Q</div>
          <div>
            <h1>QueryIQ</h1>
            <p>Intelligent Query Management</p>
          </div>
        </div>

        <div className="topbar-right">
          <span className="status-dot"></span>
          <span>System Online</span>
        </div>
      </header>

      <main className="dashboard">
        <section className="page-heading">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h2>Dashboard</h2>
            <p className="page-description">
              Monitor, classify and manage customer queries intelligently.
            </p>
          </div>
          <button className="refresh-button" onClick={refreshDashboard}>
            ↻ Refresh
          </button>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">▤</div>
            <p>Total Queries</p>
            <h3>
              {analyticsLoading ? "..." : analytics?.total_queries ?? 0}
            </h3>
            <span>Queries processed</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon">◉</div>
            <p>Average Confidence</p>
            <h3>
              {analyticsLoading
                ? "..."
                : `${analytics?.average_confidence ?? 0}%`}
            </h3>
            <span>Model prediction confidence</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon">▦</div>
            <p>Categories</p>
            <h3>{analyticsLoading ? "..." : categoryData.length}</h3>
            <span>Classification categories</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⌂</div>
            <p>Departments</p>
            <h3>{analyticsLoading ? "..." : departmentData.length}</h3>
            <span>Routing destinations</span>
          </div>
        </section>

        <section className="panel" style={{ marginBottom: "22px" }}>
          <div className="panel-heading">
            <div>
              <h3>Query Status Overview</h3>
              <p>Track the progress of customer queries</p>
            </div>
          </div>

          {analyticsLoading ? (
            <p className="muted">Loading status analytics...</p>
          ) : analyticsError ? (
            <p className="error-text">{analyticsError}</p>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: "14px",
                  marginBottom: "26px",
                }}
              >
                {statusCards.map((card) => (
                  <div
                    key={card.label}
                    style={{
                      padding: "17px",
                      border: "1px solid #e8eee9",
                      borderRadius: "10px",
                      background: "#fafcfb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#647168" }}>
                        {card.label}
                      </span>
                      <span style={{ color: "#246b4b", fontSize: "17px" }}>
                        {card.symbol}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: "25px",
                        color: "#263b30",
                        margin: "0 0 5px",
                      }}
                    >
                      {card.value}
                    </h3>

                    <span style={{ fontSize: "11px", color: "#87938a" }}>
                      {card.description}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ marginBottom: "15px" }}>
                  <h4 style={{ fontSize: "13px", margin: "0 0 4px" }}>
                    Status Distribution
                  </h4>
                  <p style={{ fontSize: "11px", color: "#89948d", margin: 0 }}>
                    Percentage of all recorded queries
                  </p>
                </div>

                <div className="chart-list">
                  {STATUS_NAMES.map((status) => (
                    <div className="chart-item" key={status}>
                      <div className="chart-label">
                        <span>{status}</span>
                        <strong>
                          {getStatusCount(status)} ({getStatusPercentage(status)}%)
                        </strong>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${getStatusPercentage(status)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        <section className="analytics-grid">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h3>Category Distribution</h3>
                <p>Queries grouped by predicted category</p>
              </div>
            </div>

            {analyticsLoading ? (
              <p className="muted">Loading analytics...</p>
            ) : analyticsError ? (
              <p className="error-text">{analyticsError}</p>
            ) : categoryData.length === 0 ? (
              <p className="empty-state">No category data available yet.</p>
            ) : (
              <div className="chart-list">
                {categoryData.map((item) => (
                  <div className="chart-item" key={item.category}>
                    <div className="chart-label">
                      <span>{item.category}</span>
                      <strong>
                        {item.count} ({item.percentage}%)
                      </strong>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-heading">
              <div>
                <h3>Department Distribution</h3>
                <p>Queries routed to each department</p>
              </div>
            </div>

            {analyticsLoading ? (
              <p className="muted">Loading analytics...</p>
            ) : analyticsError ? (
              <p className="error-text">{analyticsError}</p>
            ) : departmentData.length === 0 ? (
              <p className="empty-state">No department data available yet.</p>
            ) : (
              <div className="chart-list">
                {departmentData.map((item) => (
                  <div className="chart-item" key={item.department}>
                    <div className="chart-label">
                      <span>{item.department}</span>
                      <strong>
                        {item.count} ({item.percentage}%)
                      </strong>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill secondary-fill"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="workspace-grid">
          <div className="panel classifier-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">AI CLASSIFICATION</p>
                <h3>Classify Customer Query</h3>
                <p>Enter a customer message to predict its category.</p>
              </div>
              <div className="ai-label">✦ AI Powered</div>
            </div>

            <form onSubmit={classifyQuery}>
              <label htmlFor="customer-query">Customer Message</label>
              <textarea
                id="customer-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Example: I was charged twice for my subscription..."
                rows="5"
              />

              {error && <p className="error-text">{error}</p>}

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? "Classifying..." : "✦ Classify Query"}
              </button>
            </form>

            {result && (
              <div className="result-card">
                <div className="result-heading">
                  <span>Classification Result</span>
                  <span className="success-label">Completed</span>
                </div>

                <div className="result-grid">
                  <div>
                    <span>Predicted Category</span>
                    <strong>{result.category}</strong>
                  </div>
                  <div>
                    <span>Assigned Department</span>
                    <strong>{result.department}</strong>
                  </div>
                  <div>
                    <span>Confidence Score</span>
                    <strong>{result.confidence}%</strong>
                  </div>
                </div>

                <p className="result-message">{result.message}</p>
                {result.note && <p className="result-note">{result.note}</p>}
              </div>
            )}
          </div>

          <div className="panel info-panel">
            <p className="eyebrow">HOW IT WORKS</p>
            <h3>Intelligent Query Processing</h3>
            <p>
              QueryIQ uses Natural Language Processing and Machine Learning
              to understand and organize customer messages.
            </p>

            <div className="steps">
              <div className="step">
                <span>01</span>
                <div>
                  <strong>Query Input</strong>
                  <p>Customer submits a message.</p>
                </div>
              </div>

              <div className="step">
                <span>02</span>
                <div>
                  <strong>AI Classification</strong>
                  <p>TF-IDF and Logistic Regression predict the category.</p>
                </div>
              </div>

              <div className="step">
                <span>03</span>
                <div>
                  <strong>Department Routing</strong>
                  <p>The query is assigned to the relevant department.</p>
                </div>
              </div>

              <div className="step">
                <span>04</span>
                <div>
                  <strong>Database Storage</strong>
                  <p>Results are stored for history and analytics.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel history-panel">
          <div className="panel-heading">
            <div>
              <h3>Recent Queries</h3>
              <p>Latest customer queries processed by QueryIQ</p>
            </div>
            <span className="record-count">
              {filteredQueries.length} / {queries.length} Records
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <input
              type="search"
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Search customer queries..."
              aria-label="Search query history"
              style={{
                flex: "1 1 220px",
                minWidth: 0,
                padding: "11px 13px",
                border: "1px solid #e2e9e3",
                borderRadius: "8px",
                background: "#fafcfb",
                color: "#202b26",
                outlineColor: "#79a88a",
                fontSize: "12px",
              }}
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
              style={{
                flex: "0 1 210px",
                minWidth: "160px",
                padding: "11px 13px",
                border: "1px solid #e2e9e3",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#56645b",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearHistoryFilters}
              className="refresh-button"
            >
              Clear Filters
            </button>
          </div>

          {historyLoading ? (
            <p className="muted">Loading query history...</p>
          ) : historyError ? (
            <p className="error-text">{historyError}</p>
          ) : queries.length === 0 ? (
            <p className="empty-state">No queries have been submitted yet.</p>
          ) : filteredQueries.length === 0 ? (
            <p className="empty-state">
              No matching queries found. Try changing your search or filter.
            </p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer Query</th>
                    <th>Category</th>
                    <th>Department</th>
                    <th>Confidence</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueries.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td className="query-cell">{item.query}</td>
                      <td>
                        <span className="category-tag">{item.category}</span>
                      </td>
                      <td>{item.department}</td>
                      <td>{item.confidence}%</td>
                      <td>
                        <select
                          value={item.status || "Pending"}
                          disabled={updatingStatus === item.id}
                          onChange={(event) =>
                            updateStatus(item.id, event.target.value)
                          }
                          aria-label={`Update status for query ${item.id}`}
                          style={{
                            padding: "7px 9px",
                            border: "1px solid #e2e9e3",
                            borderRadius: "7px",
                            background: "#fafcfb",
                            color: "#246b4b",
                            fontSize: "11px",
                            cursor: "pointer",
                            opacity: updatingStatus === item.id ? 0.6 : 1,
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>

                        {updatingStatus === item.id && (
                          <span style={{ marginLeft: "5px", fontSize: "10px" }}>
                            Saving...
                          </span>
                        )}
                      </td>
                      <td>{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="footer">
          <span>QueryIQ · Intelligent Customer Query Classification</span>
          <span>Powered by Machine Learning</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
