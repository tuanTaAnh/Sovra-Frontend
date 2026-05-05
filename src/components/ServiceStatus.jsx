export default function ServiceStatus({ health }) {
  return (
    <section className="panel">
      <div className="panel-title">Services</div>

      {!health ? (
        <div className="empty-small">No health data.</div>
      ) : (
        <div className="service-list">
          <ServiceItem service={health.backend} />
          <ServiceItem service={health.rag_service} />
          <ServiceItem service={health.ingest_service} />
        </div>
      )}
    </section>
  );
}

function ServiceItem({ service }) {
  if (!service) return null;

  return (
    <div className="service-item">
      <div>
        <div className="service-name">{service.name}</div>
        <div className="service-url">{service.url}</div>
      </div>

      <span className={`service-badge ${service.ok ? "ok" : "bad"}`}>
        {service.ok ? "OK" : "DOWN"}
      </span>
    </div>
  );
}