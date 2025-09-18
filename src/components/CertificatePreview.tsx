import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Student, Mark, SUBJECTS_BY_YEAR, getSubjectsForYearSem } from '@/types';
import { Layout } from './Layout';
import { ArrowLeft, Download, Printer, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getSubjectColumnConfig } from '@/utils/subject-config';
import { api } from '@/utils/supabase-api';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

// College logo path
const collegeLogo = '/avs-college-logo.png';

interface CertificatePreviewProps {
  student: Student;
  marks: Mark[];
  onBack: () => void;
  onRefresh?: (newMarks: Mark[]) => void;
}

export function CertificatePreview({ student, marks, onBack, onRefresh }: CertificatePreviewProps) {
  const [refreshing, setRefreshing] = useState(false);
  const subjects = getSubjectsForYearSem(student.year, student.semester);
  
  // Check if any subject needs marks columns (IAT1, IAT2, Model)
  const hasAnyMarksColumns = subjects.some(subject => getSubjectColumnConfig(subject).showMarks);
  // Check if any subject needs assignment column
  const hasAnyAssignmentColumns = subjects.some(subject => getSubjectColumnConfig(subject).showAssignment);
  // Check if any subject needs department fees column
  const hasAnyDepartmentFeesColumns = subjects.some(subject => getSubjectColumnConfig(subject).showDepartmentFees);
  // Check if any subject needs due status column
  const hasAnyDueStatusColumns = subjects.some(subject => getSubjectColumnConfig(subject).showDueStatus);
  
  // Debug logging
  console.log('Subjects:', subjects);
  console.log('Has marks columns:', hasAnyMarksColumns);
  console.log('Has assignment columns:', hasAnyAssignmentColumns);
  console.log('Has department fees columns:', hasAnyDepartmentFeesColumns);
  console.log('Has due status columns:', hasAnyDueStatusColumns);
  console.log('Marks data:', marks);
  
  const getDueStatusForSubject = (subject: string, mark: any): 'Completed' | 'Pending' => {
    if (!mark) return 'Pending';
    
    // For Office and Library, only check signature
    if (subject === 'Office' || subject === 'Library') {
      return mark.signed ? 'Completed' : 'Pending';
    }
    
    // For academic subjects, check assignment submission and department fees
    return mark.assignmentSubmitted && mark.departmentFine === 0 ? 'Completed' : 'Pending';
  };

  const getMarkForSubject = (subject: string) => {
    const mark = marks.find(mark => mark.subject === subject);
    // Create a default mark object if not found
    if (!mark) {
      return {
        id: '',
        student_id: '',
        subject,
        iat1: null,
        iat2: null,
        model: null,
        signed: false,
        assignmentSubmitted: false,
        departmentFine: 0,
        created_at: new Date().toISOString()
      };
    }
    // Ensure all required fields are present with proper defaults
    return {
      ...mark,
      signed: mark.signed ?? false,
      assignmentSubmitted: mark.assignmentSubmitted ?? false,
      departmentFine: mark.departmentFine ?? 0
    };
  };

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        @page {
          size: A4;
          margin: 0;
        }
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          width: 210mm !important;
          min-height: 297mm !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body * {
          visibility: hidden;
        }
        #certificate, #certificate * {
          visibility: visible;
        }
        #certificate {
          position: relative;
          width: 210mm !important;
          min-height: 297mm !important;
          margin: 0 !important;
          padding: 10mm 15mm !important;
          box-sizing: border-box;
          background: white;
          box-shadow: none;
          font-size: 12px;
          line-height: 1.2;
          page-break-after: always;
        }
        #certificate h2 {
          font-size: 1.8em;
          margin: 0.5em 0;
        }
        #certificate table {
          width: 100% !important;
          border-collapse: collapse;
          font-size: 13px;
          page-break-inside: avoid;
          border: 2px solid #1e40af;
        }
        #certificate th, #certificate td {
          padding: 8px 12px;
          border: 1px solid #94a3b8;
        }
        #certificate th {
          background-color: #dbeafe;
          color: #1e40af;
          font-weight: 600;
        }
        #certificate tr:nth-child(even) {
          background-color: #f8fafc;
        }
        #certificate tr:hover {
          background-color: #f1f5f9;
        }
        .no-print, .no-print * {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      const { marks: refreshedMarks } = await api.getStudentByRegNo(student.register_number);
      onRefresh(refreshedMarks);
      toast({
        title: "Success",
        description: "Data refreshed successfully",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('certificate');
    if (!element) return;

    // Get the dimensions of the content
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    
    // Calculate the aspect ratio for A4
    const a4Width = 210; // A4 width in mm
    const a4Height = 297; // A4 height in mm
    const imgWidth = a4Width - 20; // Add margins
    const imgHeight = (height * imgWidth) / width;

    // Create a canvas for the PDF
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: width,
      windowHeight: height
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add the image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(
      imgData,
      'PNG',
      10, // x position (10mm margin)
      10, // y position (10mm margin)
      imgWidth,
      imgHeight
    );

    // Save the PDF
    pdf.save(`no-due-certificate-${student.register_number}.pdf`);
  };

  return (
    <Layout showHeader={false}>
      <div className="container mx-auto p-4">
        {/* College Header Image */}
        <div className="mb-6 w-full">
          <img 
            src="/avs-college-header.png" 
            alt="AVS Engineering College"
            className="w-full h-auto max-h-40 object-contain mx-auto"
            onError={(e) => {
              // Fallback to text if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'text-center py-4';
              fallback.innerHTML = `
                <h1 className="text-2xl font-bold text-blue-800">AVS Engineering College</h1>
                <p className="text-gray-600">Salem, Tamil Nadu</p>
              `;
              target.parentNode?.insertBefore(fallback, target.nextSibling);
            }}
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Certificate */}
        <Card id="certificate" className="p-4 sm:p-6 md:p-8 print:p-0 print:shadow-none print:border-0" style={{ 
          width: '100%',
          maxWidth: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          position: 'relative',
          boxSizing: 'border-box',
          backgroundColor: 'white',
          overflowX: 'auto'
        }}>
          {/* Header */}
          <div className="text-center mb-6 print:mb-4 print:pt-8 print:px-8">
            <div className="flex flex-col items-center mb-4">
              <div className="text-2xl font-bold text-blue-800 mb-2">AVS Engineering College</div>
              <div className="w-32 h-1 bg-blue-600 mb-2"></div>
              <div className="text-sm text-gray-600">Salem, Tamil Nadu</div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 print:text-3xl">
              NO DUE CERTIFICATE
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-6 print:mb-4"></div>
          </div>

          {/* Student Details */}
          <div className="mb-8 print:mb-6 print:px-8">
            <div className="grid grid-cols-2 gap-8 print:gap-12">
              {/* Left side - Name and Register Number */}
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-1">
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-base">{student.name}</p>
                </div>
                <div className="border-b border-gray-200 pb-1">
                  <p className="text-xs text-gray-500">Register Number</p>
                  <p className="text-base font-mono">{student.register_number}</p>
                </div>
                {student.semester && (
                  <div className="border-b border-gray-200 pb-1">
                    <p className="text-xs text-gray-500">Semester</p>
                    <p className="text-base">{student.semester}{student.semester === 1 ? 'st' : student.semester === 2 ? 'nd' : student.semester === 3 ? 'rd' : 'th'} Semester</p>
                  </div>
                )}
              </div>
              
              {/* Right side - Date, Department and Year */}
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-1">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-base">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="border-b border-gray-200 pb-1">
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-base">{student.department}</p>
                </div>
                <div className="border-b border-gray-200 pb-1">
                  <p className="text-xs text-gray-500">Year</p>
                  <p className="text-base">{student.year === 2 ? '2nd Year' : '3rd Year'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Marks Table */}
          <div className="mb-6 print:mb-4 print:px-8 print:mt-8 overflow-x-auto">
            <table className="w-full border-collapse border-2 border-gray-300 print:text-sm min-w-[900px] sm:min-w-0">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border-2 border-gray-300 px-2 py-3 text-left font-bold text-xs sm:text-sm md:text-base print:px-3 print:py-2">Subject</th>
                  {hasAnyMarksColumns && (
                    <th className="border-2 border-gray-300 px-1 py-3 text-center font-bold text-xs sm:text-sm md:text-base print:px-2 print:py-2">IAT1</th>
                  )}
                  {hasAnyMarksColumns && (
                    <th className="border-2 border-gray-300 px-1 py-3 text-center font-bold text-xs sm:text-sm md:text-base print:px-2 print:py-2">IAT2</th>
                  )}
                  {hasAnyMarksColumns && (
                    <th className="border-2 border-gray-300 px-1 py-3 text-center font-bold text-xs sm:text-sm md:text-base print:px-2 print:py-2">Model</th>
                  )}
                  {hasAnyAssignmentColumns && (
                    <th className="border-2 border-gray-300 px-1 py-3 text-center font-bold text-xs sm:text-sm md:text-base print:px-2 print:py-2">Assignment Submission</th>
                  )}
                  {hasAnyDepartmentFeesColumns && (
                    <th className="border-2 border-gray-300 px-1 py-3 text-center font-bold text-xs sm:text-sm md:text-base print:px-2 print:py-2">Departmental Fees (₹)</th>
                  )}
                  {hasAnyDueStatusColumns && (
                    <th className="border-2 border-gray-300 px-1 py-3 text-center font-bold text-xs sm:text-sm md:text-base print:px-2 print:py-2">Due Status</th>
                  )}
                  <th className="border-2 border-gray-300 px-1 py-3 text-center font-bold text-xs sm:text-sm md:text-base print:px-2 print:py-2">Signature</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => {
                  const mark = getMarkForSubject(subject);
                  const config = getSubjectColumnConfig(subject);
                  return (
                    <tr key={subject} className="hover:bg-gray-50">
                      <td className="border-2 border-gray-300 px-2 py-2 text-xs sm:text-sm print:px-2 print:py-2">{subject}</td>
                      {hasAnyMarksColumns && (
                        <td className="border-2 border-gray-300 px-1 py-2 text-center text-xs sm:text-sm print:px-1 print:py-2">
                          {config.showMarks ? (mark?.iat1 !== undefined ? mark.iat1 : '-') : '-'}
                        </td>
                      )}
                      {hasAnyMarksColumns && (
                        <td className="border-2 border-gray-300 px-1 py-2 text-center text-xs sm:text-sm print:px-1 print:py-2">
                          {config.showMarks ? (mark?.iat2 !== undefined ? mark.iat2 : '-') : '-'}
                        </td>
                      )}
                      {hasAnyMarksColumns && (
                        <td className="border-2 border-gray-300 px-1 py-2 text-center text-xs sm:text-sm print:px-1 print:py-2">
                          {config.showMarks ? (mark?.model !== undefined ? mark.model : '-') : '-'}
                        </td>
                      )}
                      {hasAnyAssignmentColumns && (
                        <td className="border-2 border-gray-300 px-1 py-2 text-center text-xs sm:text-sm print:px-1 print:py-2">
                          {config.showAssignment ? (
                            mark?.assignmentSubmitted ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-700">
                                ✓
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">Not Submitted</span>
                            )
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
                      {hasAnyDepartmentFeesColumns && (
                        <td className="border-2 border-gray-300 px-1 py-2 text-center text-xs sm:text-sm print:px-1 print:py-2">
                          {config.showDepartmentFees ? (mark?.departmentFine > 0 ? `₹${mark.departmentFine}` : '₹0') : '-'}
                        </td>
                      )}
                      {hasAnyDueStatusColumns && (
                        <td className="border-2 border-gray-300 px-1 py-2 text-center text-xs sm:text-sm print:px-1 print:py-2">
                          {config.showDueStatus ? (
                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium ${
                              getDueStatusForSubject(subject, mark) === 'Completed'
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {getDueStatusForSubject(subject, mark)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
                      <td className="border-2 border-gray-300 px-1 py-2 text-center text-xs sm:text-sm print:px-1 print:py-2">
                        {mark?.signed ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-700">
                            ✓
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 print:mt-8 print:pt-6 print:px-8 print:absolute print:bottom-8 print:left-0 print:right-0">
            <div className="flex justify-between items-end">
              <div className="text-center">
                <div className="w-32 border-b border-gray-400 mb-2"></div>
                <p className="text-sm font-medium">CC Signature</p>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-gray-400 mb-2"></div>
                <p className="text-sm font-medium">HOD Signature</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}