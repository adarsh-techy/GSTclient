import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTenants } from '../../../api';
import { getActiveTenantId, setActiveTenantId } from '../../../api';

export function TenantSelector() {
  const qc = useQueryClient();
  const tenantsQuery = useQuery({
    queryKey: ['tenants'],
    queryFn: fetchTenants,
    staleTime: 60_000,
    retry: false,
  });
  const [active, setActive] = useState<string>(getActiveTenantId());

  useEffect(() => {
    const onChange = () => setActive(getActiveTenantId());
    window.addEventListener('gstautopilot:tenant-changed', onChange);
    return () => window.removeEventListener('gstautopilot:tenant-changed', onChange);
  }, []);

  const change = (tenantId: string) => {
    setActiveTenantId(tenantId);
    setActive(tenantId);

    qc.clear();
    window.location.assign('/login');
  };

  const tenants = tenantsQuery.data ?? [];
  if (tenants.length <= 1) return null; 

  return (
    <div className="tenant-selector">
      <label className="tenant-selector-label">Tenant</label>
      <select
        className="tenant-selector-select"
        value={active}
        onChange={(e) => change(e.target.value)}
      >
        {tenants.map((t) => (
          <option key={t.tenantId} value={t.tenantId}>
            {t.name}{t.flavor !== 'Default' ? ` · ${t.flavor}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
