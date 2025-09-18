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
          font-size: 11px;
          page-break-inside: avoid;
          border: 1px solid #d1d5db;
        }
        #certificate th, #certificate td {
          padding: 6px 4px;
          border: 1px solid #d1d5db;
          text-align: center;
        }
        #certificate th {
          background-color: #f3f4f6 !important;
          color: #374151 !important;
          font-weight: bold;
          font-size: 10px;
        }
        #certificate td {
          background-color: #ffffff !important;
          color: #374151 !important;
          font-size: 10px;
          height: 35px;
        }
        #certificate .bg-gradient-to-r {
          background: #f8fafc !important;
        }
        #certificate .rounded-full,
        #certificate .rounded-lg,
        #certificate .rounded-xl {
          border-radius: 4px !important;
        }
        #certificate .shadow-lg,
        #certificate .shadow-sm {
          box-shadow: none !important;
        }
        #certificate .border-4 {
          border-width: 2px !important;
        }
        #certificate .text-3xl {
          font-size: 1.5rem !important;
        }
        #certificate .text-4xl {
          font-size: 1.8rem !important;
        }
        .no-print, .no-print * {
          display: none !important;
        }
        @media print {
          #certificate .bg-blue-50,
          #certificate .bg-indigo-50,
          #certificate .bg-green-50,
          #certificate .bg-yellow-50,
          #certificate .bg-orange-50,
          #certificate .bg-purple-50,
          #certificate .bg-red-50 {
            background-color: #f9fafb !important;
          }
          #certificate .bg-blue-100,
          #certificate .bg-green-100,
          #certificate .bg-yellow-100,
          #certificate .bg-red-100,
          #certificate .bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          #certificate .text-blue-600,
          #certificate .text-green-600,
          #certificate .text-yellow-600,
          #certificate .text-red-600,
          #certificate .text-gray-600 {
            color: #374151 !important;
          }
          #certificate .bg-blue-600,
          #certificate .bg-indigo-600 {
            background-color: #4b5563 !important;
            color: white !important;
          }
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
          <div className="text-center mb-8 print:mb-6 print:pt-8 print:px-8">
            <div className="relative">
              {/* Decorative border */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100 rounded-lg opacity-30"></div>
              <div className="relative bg-white border-4 border-blue-600 rounded-lg p-6 shadow-lg">
                <div className="flex flex-col items-center">
                  {/* College logo placeholder */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-white font-bold text-xl">AVS</span>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent mb-2">
                    AVS ENGINEERING COLLEGE
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-blue-600"></div>
                    <div className="text-sm text-blue-700 font-medium tracking-wide">SALEM, TAMIL NADU</div>
                    <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-blue-600"></div>
                  </div>
                  <div className="text-sm text-gray-500 italic">Autonomous Institution</div>
                </div>
              </div>
            </div>
            
            {/* Certificate Title */}
            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
              </div>
              <div className="relative bg-white px-8">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-blue-800 bg-clip-text text-transparent tracking-wide">
                  NO DUE CERTIFICATE
                </h2>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="flex justify-center mt-4 space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
          </div>

          {/* Student Details */}
          <div className="mb-8 print:mb-6 print:px-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side - Name and Register Number */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Student Name</p>
                    <p className="text-lg font-bold text-gray-800">{student.name}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Register Number</p>
                    <p className="text-lg font-mono font-bold text-gray-800">{student.register_number}</p>
                  </div>
                  {student.semester && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Semester</p>
                      <p className="text-lg font-bold text-gray-800">{student.semester}{student.semester === 1 ? 'st' : student.semester === 2 ? 'nd' : student.semester === 3 ? 'rd' : 'th'} Semester</p>
                    </div>
                  )}
                </div>
                
                {/* Right side - Date, Department and Year */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-500">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Issue Date</p>
                    <p className="text-lg font-bold text-gray-800">{new Date().toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Department</p>
                    <p className="text-lg font-bold text-gray-800">{student.department}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-indigo-500">
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Academic Year</p>
                    <p className="text-lg font-bold text-gray-800">{student.year === 2 ? '2nd Year' : '3rd Year'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Marks Table */}
          <div className="mb-8 print:mb-6 print:px-8 print:mt-8">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-100 overflow-hidden relative">
              {/* Decorative corner elements */}
              <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-transparent opacity-10 rounded-br-full"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-500 to-transparent opacity-10 rounded-bl-full"></div>
              
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 relative">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xl">🎓</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-wide">
                    ACADEMIC PERFORMANCE & CLEARANCE STATUS
                  </h3>
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xl">📋</span>
                  </div>
                </div>
                {/* Decorative line */}
                <div className="mt-3 flex justify-center">
                  <div className="w-32 h-1 bg-white bg-opacity-30 rounded-full"></div>
                </div>
              </div>
              
              <div className="overflow-x-auto bg-gradient-to-b from-gray-50 to-white">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-100 via-blue-50 to-slate-100">
                      <th className="border-2 border-blue-200 px-4 py-5 text-center font-bold text-sm text-slate-700 bg-gradient-to-b from-blue-100 to-blue-50 relative">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-blue-600">📚</span>
                          <span>SUBJECT</span>
                        </div>
                      </th>
                      <th className="border-2 border-green-200 px-3 py-5 text-center font-bold text-sm text-slate-700 bg-gradient-to-b from-green-100 to-green-50">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-green-600">📝</span>
                          <span>IAT1</span>
                        </div>
                      </th>
                      <th className="border-2 border-green-200 px-3 py-5 text-center font-bold text-sm text-slate-700 bg-gradient-to-b from-green-100 to-green-50">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-green-600">📝</span>
                          <span>IAT2</span>
                        </div>
                      </th>
                      <th className="border-2 border-green-200 px-3 py-5 text-center font-bold text-sm text-slate-700 bg-gradient-to-b from-green-100 to-green-50">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-green-600">📋</span>
                          <span>MODEL</span>
                        </div>
                      </th>
                      <th className="border-2 border-purple-200 px-3 py-5 text-center font-bold text-sm text-slate-700 bg-gradient-to-b from-purple-100 to-purple-50">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-purple-600">📄</span>
                          <span>ASSIGNMENT</span>
                        </div>
                      </th>
                      <th className="border-2 border-orange-200 px-3 py-5 text-center font-bold text-sm text-slate-700 bg-gradient-to-b from-orange-100 to-orange-50">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-orange-600">💰</span>
                          <span>FEES</span>
                        </div>
                      </th>
                      <th className="border-2 border-yellow-200 px-3 py-5 text-center font-bold text-sm text-slate-700 bg-gradient-to-b from-yellow-100 to-yellow-50">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-yellow-600">⏱️</span>
                          <span>STATUS</span>
                        </div>
                      </th>
                      <th className="border-2 border-indigo-200 px-3 py-5 text-center font-bold text-sm text-slate-700 bg-gradient-to-b from-indigo-100 to-indigo-50">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-indigo-600">✍️</span>
                          <span>SIGNATURE</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject, index) => {
                      const mark = getMarkForSubject(subject);
                      const config = getSubjectColumnConfig(subject);
                      const isEven = index % 2 === 0;
                      return (
                        <tr key={subject} className={`${isEven ? 'bg-gradient-to-r from-white to-blue-50' : 'bg-gradient-to-r from-blue-50 to-white'} hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 transform hover:scale-[1.01]`}>
                          <td className="border-2 border-blue-200 px-4 py-5 text-center text-sm font-bold text-slate-800 relative">
                            <div className="flex items-center justify-center gap-3">
                              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm"></div>
                              <span className="tracking-wide">{subject}</span>
                              <div className="w-1 h-6 bg-gradient-to-b from-blue-300 to-transparent rounded-full"></div>
                            </div>
                          </td>
                          <td className="border-2 border-green-200 px-3 py-5 text-center text-sm font-medium text-slate-700">
                            {config.showMarks ? (
                              mark?.iat1 !== null && mark?.iat1 !== undefined ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold shadow-lg transform transition-transform hover:scale-110 ${
                                    mark.iat1 >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' :
                                    mark.iat1 >= 60 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                                    'bg-gradient-to-br from-red-400 to-red-600 text-white'
                                  }`}>
                                    {mark.iat1}
                                  </span>
                                  <div className={`w-8 h-1 rounded-full ${
                                    mark.iat1 >= 80 ? 'bg-green-300' :
                                    mark.iat1 >= 60 ? 'bg-yellow-300' :
                                    'bg-red-300'
                                  }`}></div>
                                </div>
                              ) : <span className="text-slate-400 text-lg">—</span>
                            ) : <span className="text-slate-400 text-lg">—</span>}
                          </td>
                          <td className="border-2 border-green-200 px-3 py-5 text-center text-sm font-medium text-slate-700">
                            {config.showMarks ? (
                              mark?.iat2 !== null && mark?.iat2 !== undefined ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold shadow-lg transform transition-transform hover:scale-110 ${
                                    mark.iat2 >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' :
                                    mark.iat2 >= 60 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                                    'bg-gradient-to-br from-red-400 to-red-600 text-white'
                                  }`}>
                                    {mark.iat2}
                                  </span>
                                  <div className={`w-8 h-1 rounded-full ${
                                    mark.iat2 >= 80 ? 'bg-green-300' :
                                    mark.iat2 >= 60 ? 'bg-yellow-300' :
                                    'bg-red-300'
                                  }`}></div>
                                </div>
                              ) : <span className="text-slate-400 text-lg">—</span>
                            ) : <span className="text-slate-400 text-lg">—</span>}
                          </td>
                          <td className="border-2 border-green-200 px-3 py-5 text-center text-sm font-medium text-slate-700">
                            {config.showMarks ? (
                              mark?.model !== null && mark?.model !== undefined ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold shadow-lg transform transition-transform hover:scale-110 ${
                                    mark.model >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' :
                                    mark.model >= 60 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                                    'bg-gradient-to-br from-red-400 to-red-600 text-white'
                                  }`}>
                                    {mark.model}
                                  </span>
                                  <div className={`w-8 h-1 rounded-full ${
                                    mark.model >= 80 ? 'bg-green-300' :
                                    mark.model >= 60 ? 'bg-yellow-300' :
                                    'bg-red-300'
                                  }`}></div>
                                </div>
                              ) : <span className="text-slate-400 text-lg">—</span>
                            ) : <span className="text-slate-400 text-lg">—</span>}
                          </td>
                          <td className="border-2 border-purple-200 px-3 py-5 text-center text-sm font-medium">
                            {config.showAssignment ? (
                              mark?.assignmentSubmitted ? (
                                <div className="flex flex-col items-center gap-2">
                                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform transition-transform hover:scale-105">
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                    SUBMITTED
                                  </span>
                                  <div className="text-green-600 text-lg">✨</div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-lg">
                                    <span className="w-2 h-2 bg-white rounded-full opacity-60"></span>
                                    PENDING
                                  </span>
                                  <div className="text-gray-400 text-lg">⏱️</div>
                                </div>
                              )
                            ) : <span className="text-slate-400 text-lg">—</span>}
                          </td>
                          <td className="border-2 border-orange-200 px-3 py-5 text-center text-sm font-medium">
                            {config.showDepartmentFees ? (
                              mark?.departmentFine === 0 ? (
                                <div className="flex flex-col items-center gap-2">
                                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform transition-transform hover:scale-105">
                                    <span className="text-white text-sm">💎</span>
                                    PAID
                                  </span>
                                  <div className="text-green-600 text-lg">✅</div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-red-700 text-white shadow-lg animate-pulse">
                                    <span className="text-white text-sm">⚡</span>
                                    NOT PAID
                                  </span>
                                  <div className="text-red-600 text-lg">❌</div>
                                </div>
                              )
                            ) : <span className="text-slate-400 text-lg">—</span>}
                          </td>
                          <td className="border-2 border-yellow-200 px-3 py-5 text-center text-sm font-medium">
                            {config.showDueStatus ? (
                              getDueStatusForSubject(subject, mark) === 'Completed' ? (
                                <div className="flex flex-col items-center gap-2">
                                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform transition-transform hover:scale-105">
                                    <span className="text-white text-sm">🎯</span>
                                    COMPLETED
                                  </span>
                                  <div className="text-green-600 text-lg">🏆</div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg">
                                    <span className="text-white text-sm">⏰</span>
                                    PENDING
                                  </span>
                                  <div className="text-yellow-600 text-lg">⏳</div>
                                </div>
                              )
                            ) : <span className="text-slate-400 text-lg">—</span>}
                          </td>
                          <td className="border-2 border-indigo-200 px-3 py-5 text-center text-sm font-medium">
                            {mark?.signed ? (
                              <div className="flex flex-col items-center gap-2">
                                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-lg transform transition-transform hover:scale-110">
                                  <span className="text-xl font-bold">✓</span>
                                </span>
                                <div className="text-green-600 text-sm font-bold">SIGNED</div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-gray-600 shadow-lg border-2 border-dashed border-gray-400">
                                  <span className="text-xl">○</span>
                                </span>
                                <div className="text-gray-500 text-sm font-medium">PENDING</div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 print:mt-8 print:pt-6 print:px-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                {/* CC Signature */}
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-dashed border-blue-300 mb-3">
                    <div className="h-16 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Digital Signature</span>
                    </div>
                  </div>
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                    <p className="text-sm font-bold">Class Coordinator</p>
                    <p className="text-xs opacity-90">Signature & Seal</p>
                  </div>
                </div>
                
                {/* Certificate Validity */}
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                    <div className="text-green-600 mb-2">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <p className="text-sm font-bold text-green-800">Certificate Valid</p>
                    <p className="text-xs text-green-600">Digitally Verified</p>
                    <div className="mt-2 text-xs text-gray-500">
                      ID: {student.register_number}-{new Date().getFullYear()}
                    </div>
                  </div>
                </div>
                
                {/* HOD Signature */}
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-dashed border-indigo-300 mb-3">
                    <div className="h-16 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Digital Signature</span>
                    </div>
                  </div>
                  <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
                    <p className="text-sm font-bold">Head of Department</p>
                    <p className="text-xs opacity-90">Signature & Seal</p>
                  </div>
                </div>
              </div>
              
              {/* Bottom border decoration */}
              <div className="mt-6 flex justify-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-px bg-gradient-to-r from-transparent to-blue-400"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="w-16 h-px bg-blue-400"></div>
                  <div className="text-xs text-blue-600 font-medium px-3">AVS ENGINEERING COLLEGE</div>
                  <div className="w-16 h-px bg-blue-400"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="w-8 h-px bg-gradient-to-l from-transparent to-blue-400"></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}