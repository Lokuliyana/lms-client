"use client";
import { useClasses } from '@/hooks/useClasses';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

export default function ClassesPage() {
  const { classes, isLoading, applications, approve } = useClasses();
  const { hasPermissionSync } = usePermissions();

  if (isLoading) return <div className="p-8">Loading classes...</div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Class Catalog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => (
          <Card key={cls.id} className="bg-[#F8FAFC] shadow-soft">
            <CardHeader>
              <CardTitle>{cls.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">{cls.description}</p>
              <p className="font-semibold">Price: $${cls.price}</p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Batches:</h4>
                {cls.batches.map(b => (
                  <div key={b.id} className="text-sm bg-white p-2 rounded border border-slate-200">
                    <div className="flex justify-between">
                      <span>{b.name}</span>
                      <Badge variant="outline">{b.enrolled}/{b.capacity}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{b.schedule}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasPermissionSync('classes.update') && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Pending Applications (Moderator View)</h2>
          <div className="space-y-4">
            {applications.filter(a => a.status === 'PENDING').map(app => (
              <Card key={app.id} className="p-4 flex items-center justify-between shadow-soft">
                <div>
                  <span className="font-semibold">Student: {app.studentId}</span>
                  <span className="mx-2">|</span>
                  <span className="text-slate-600">Class: {app.classId}</span>
                </div>
                <Button onClick={() => approve(app.id)}>Approve</Button>
              </Card>
            ))}
            {applications.filter(a => a.status === 'PENDING').length === 0 && (
              <p className="text-slate-500">No pending applications.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
