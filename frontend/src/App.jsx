import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:8000/api";

function App() {
  const [foods, setFoods] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clarifications, setClarifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFoods();
  }, []);

  async function fetchFoods() {
    try {
      const res = await fetch(`${API}/foods`);
      if (!res.ok) throw new Error("Failed to load foods");
      setFoods(await res.json());
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const description = input.trim();
    if (!description || loading) return;

    setLoading(true);
    setError(null);
    setClarifications([]);

    try {
      const res = await fetch(`${API}/foods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Something went wrong");
      }

      const data = await res.json();

      if (data.saved?.length) {
        setFoods((prev) => [...data.saved, ...prev]);
      }

      if (data.clarifications?.length) {
        setClarifications(data.clarifications);
      }

      setInput("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const prev = foods;
    setFoods((f) => f.filter((item) => item.id !== id));

    try {
      const res = await fetch(`${API}/foods/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setFoods(prev);
      setError("Failed to delete item");
    }
  }

  function dismissClarification(index) {
    setClarifications((c) => c.filter((_, i) => i !== index));
  }

  const totals = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + (f.calories || 0),
      protein_g: acc.protein_g + (f.protein_g || 0),
      carbs_g: acc.carbs_g + (f.carbs_g || 0),
      fat_g: acc.fat_g + (f.fat_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">MacroBud</h1>
        <p className="tagline">Estimate your macros, skip the measuring cup</p>
      </header>

      {clarifications.map((c, i) => (
        <div key={i} className="clarification">
          <span className="clarification-icon">?</span>
          <div className="clarification-text">
            <strong>{c.description}</strong> &mdash;{" "}
            {c.clarification_message}
          </div>
          <button
            className="clarification-dismiss"
            onClick={() => dismissClarification(i)}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      ))}

      {error && (
        <div className="error">
          {error}
          <button className="error-dismiss" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      <form className="input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="food-input"
          placeholder="e.g. 1 slice of rye bread, 2 eggs, a glass of milk"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="add-btn" disabled={loading || !input.trim()}>
          {loading ? <span className="spinner" /> : "Add"}
        </button>
      </form>

      {foods.length > 0 && (
        <div className="totals">
          <div className="totals-label">Running Totals</div>
          <div className="totals-grid">
            <div className="total-item">
              <span className="total-value">{totals.calories.toFixed(1)}</span>
              <span className="total-label">cal</span>
            </div>
            <div className="total-item">
              <span className="total-value">{totals.protein_g.toFixed(1)}g</span>
              <span className="total-label">protein</span>
            </div>
            <div className="total-item">
              <span className="total-value">{totals.carbs_g.toFixed(1)}g</span>
              <span className="total-label">carbs</span>
            </div>
            <div className="total-item">
              <span className="total-value">{totals.fat_g.toFixed(1)}g</span>
              <span className="total-label">fat</span>
            </div>
          </div>
        </div>
      )}

      <ul className="food-list">
        {foods.map((food) => (
          <li key={food.id} className="food-card">
            <div className="food-header">
              <span className="food-description">{food.description}</span>
              <button
                className="delete-btn"
                onClick={() => handleDelete(food.id)}
                aria-label="Delete"
              >
                &times;
              </button>
            </div>
            <div className="food-macros">
              <span className="macro cal">{food.calories} cal</span>
              <span className="macro protein">{food.protein_g}g P</span>
              <span className="macro carbs">{food.carbs_g}g C</span>
              <span className="macro fat">{food.fat_g}g F</span>
            </div>
          </li>
        ))}
      </ul>

      {foods.length === 0 && !loading && (
        <p className="empty-state">
          No foods logged yet. Start typing above to estimate your macros!
        </p>
      )}
    </div>
  );
}

export default App;
