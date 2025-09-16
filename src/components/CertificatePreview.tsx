import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Student, Mark, SUBJECTS_BY_YEAR } from '@/types';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface CertificatePreviewProps {
  student: Student;
  marks: Mark[];
  onBack: () => void;
}

export function CertificatePreview({ student, marks, onBack }: CertificatePreviewProps) {
  const subjects = SUBJECTS_BY_YEAR[student.year as keyof typeof SUBJECTS_BY_YEAR];
  
  const getMarkForSubject = (subject: string) => {
    return marks.find(mark => mark.subject === subject);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('certificate');
    const opt = {
      margin: 0.5,
      filename: `no-due-certificate-${student.register_number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Control buttons */}
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Save as PDF
          </Button>
        </div>

        {/* Certificate */}
        <Card id="certificate" className="bg-white p-8 print:shadow-none print:border-none">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">
              AVSEC Institute of Technology
            </h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              NO DUE CERTIFICATE
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>

          {/* Student Details */}
          <div className="mb-8 space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Student Name:</span>
              <span className="font-medium">{student.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Register Number:</span>
              <span className="font-mono font-medium">{student.register_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Year:</span>
              <span className="font-medium">{student.year === 2 ? '2nd Year' : '3rd Year'}</span>
            </div>
          </div>

          {/* Marks Table */}
          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Subject</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">IAT1</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">IAT2</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Model</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Signature</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => {
                  const mark = getMarkForSubject(subject);
                  return (
                    <tr key={subject} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-medium">{subject}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {mark?.iat1 ?? '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {mark?.iat2 ?? '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {mark?.model ?? '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center h-12"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-end">
              <div className="text-center">
                <div className="w-32 border-b border-gray-400 mb-2"></div>
                <p className="text-sm font-medium">Faculty Signature</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Date: {new Date().toLocaleDateString()}</p>
                <div className="w-32 border-b border-gray-400 mb-2"></div>
                <p className="text-sm font-medium">Principal Signature</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}