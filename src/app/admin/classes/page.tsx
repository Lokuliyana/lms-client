'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClasses } from '@/services/classService';
import { ClassCard } from '@/components/reusable/classCard';
import { ClayEmptyState } from '@/components/reusable/ClayEmptyState';
import { CLAY_ASSETS } from '@/constants/clayAssets';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/dev/button';
import { SectionHeader } from '@/components/reusable/section-header';
import { HiAcademicCap, HiPlus } from 'react-icons/hi2';

const AdminClassesPage = () => {
  const { user, isAuthenticated, isTeacher } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isTeacher) {
      router.push('/unauthorized');
      return;
    }

    const fetchClasses = async () => {
      try {
        const data = await getClasses({});
        setClasses(data);
      } catch (err) {
        setError('Failed to load classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user, isAuthenticated, isTeacher]);

  const handleAddClass = () => {
    router.push('/admin/classes/add');
  };

  if (!isAuthenticated || !isTeacher) return null;

  return (
    <div className="space-y-6 sm:space-y-7">
      <SectionHeader
        title="Manage Classes"
        description="View and manage active lecture streams, enrolled batches, and academic curriculum."
        breadcrumbs={[
          { label: "Home", href: "/admin/dashboard" },
          { label: "Classes", href: "/admin/classes" },
        ]}
        actions={
          <Button
            onClick={handleAddClass}
            variant="primary"
            className="rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-[0.98] px-4 py-2.5"
          >
            <HiPlus className="w-4 h-4 mr-1.5" />
            Create Class
          </Button>
        }
        illustration={CLAY_ASSETS.thumbTheoryOpenbook}
        variant="rose"
        icon={HiAcademicCap as any}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-3xl bg-slate-100 animate-pulse border border-slate-200/60" />
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : classes.length === 0 ? (
        <ClayEmptyState
          illustration={CLAY_ASSETS.emptyNoClassesToday}
          title="No Classes Created Yet"
          description="Create your first class to configure live lectures, revision sessions, and student enrollments."
          action={{
            label: "+ Add Class",
            onClick: handleAddClass,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <ClassCard
              id={classItem._id}
              classId={classItem.classId}
              key={classItem._id}
              image={classItem.image || '/images/placeholder.jpg'}
              title={classItem.title}
              description={classItem.description}
              labels={classItem.labels}
              grade={classItem.grade}
              subject={classItem.subject}
              classTime={classItem.classTime}
              classFee={classItem.classFee}
              href={`/classes/${classItem._id}`}
              ctaLabel="Manage Class"
              teacher={classItem.teacher}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminClassesPage;
