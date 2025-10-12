'use client';

import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

interface UrlEntry {
  id: string;
  title: string;
  url: string;
  description: string;
}

export default function Dashboard() {
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [filteredUrls, setFilteredUrls] = useState<UrlEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUrls();
  }, []);

  useEffect(() => {
    const filtered = urls.filter(url =>
      url.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUrls(filtered);
  }, [searchTerm, urls]);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/urls');
      
      if (!response.ok) {
        throw new Error('Failed to fetch URLs');
      }
      
      const data = await response.json();
      setUrls(data.urls);
      setFilteredUrls(data.urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoClick = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="text-center mb-4">
        <h1 className="display-4">Nocodb URL Shortening Dashboard</h1>
        <p className="lead">Manage and access your shortened URLs</p>
      </div>

      <div className="row mb-4">
        <div className="col-md-6 mx-auto">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search URLs by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-outline-secondary" type="button">
               🔍 Search
             </button>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {filteredUrls.map((url) => (
          <div key={url.id} className="col-md-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title text-primary">{url.title}</h5>
                <p className="card-text flex-grow-1">{url.description}</p>
                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-success"
                    onClick={() => handleGoClick(url.url)}
                  >
                    GO →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUrls.length === 0 && (
        <div className="text-center mt-5">
          <p className="text-muted">No URLs found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
