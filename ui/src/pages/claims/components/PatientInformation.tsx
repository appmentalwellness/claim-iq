import React from 'react';
import { User, Calendar, Phone, Mail, MapPin, FileText, AlertCircle } from 'lucide-react';
import { Claim } from '@/types';
import { Card } from '@/components/ui/Card';

interface PatientInformationProps {
  claim: Claim;
}

const PatientInformation: React.FC<PatientInformationProps> = ({ claim }) => {
  // Mock patient data - in real implementation, this would come from the API
  const mockPatientData = {
    name: 'Rajesh Kumar',
    dateOfBirth: '1985-03-15',
    gender: 'Male',
    contactInfo: {
      phone: '+91 98765 43210',
      email: 'rajesh.kumar@email.com',
      address: '123 MG Road, Bangalore, Karnataka 560001',
    },
    medicalRecordNumber: 'MRN-2024-001234',
    insuranceNumber: 'INS-789456123',
    emergencyContact: {
      name: 'Priya Kumar',
      relationship: 'Spouse',
      phone: '+91 98765 43211',
    },
    medicalHistory: [
      'Diabetes Type 2 (2018)',
      'Hypertension (2020)',
      'Previous cardiac procedure (2022)',
    ],
    allergies: ['Penicillin', 'Shellfish'],
    currentMedications: [
      'Metformin 500mg - Twice daily',
      'Lisinopril 10mg - Once daily',
      'Aspirin 81mg - Once daily',
    ],
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (!claim.patientId) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Patient Information</h3>
          <p className="text-gray-600">
            Patient information has not been linked to this claim yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
          <span className="text-sm text-gray-500">ID: {claim.patientId}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-medium text-gray-900">{mockPatientData.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-medium text-gray-900">
                  {formatDate(mockPatientData.dateOfBirth)} 
                  <span className="text-gray-500 ml-2">
                    (Age: {calculateAge(mockPatientData.dateOfBirth)})
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Gender</p>
                <p className="font-medium text-gray-900">{mockPatientData.gender}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Medical Record Number</p>
                <p className="font-medium text-gray-900">{mockPatientData.medicalRecordNumber}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium text-gray-900">{mockPatientData.contactInfo.phone}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="font-medium text-gray-900">{mockPatientData.contactInfo.email}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium text-gray-900">{mockPatientData.contactInfo.address}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Insurance Number</p>
                <p className="font-medium text-gray-900">{mockPatientData.insuranceNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium text-gray-900">{mockPatientData.emergencyContact.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Relationship</p>
            <p className="font-medium text-gray-900">{mockPatientData.emergencyContact.relationship}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone Number</p>
            <p className="font-medium text-gray-900">{mockPatientData.emergencyContact.phone}</p>
          </div>
        </div>
      </Card>

      {/* Medical History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
        
        <div className="space-y-2">
          {mockPatientData.medicalHistory.map((condition, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-900">{condition}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Allergies */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Known Allergies</h3>
        
        <div className="flex flex-wrap gap-2">
          {mockPatientData.allergies.map((allergy, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              {allergy}
            </span>
          ))}
        </div>
      </Card>

      {/* Current Medications */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Medications</h3>
        
        <div className="space-y-3">
          {mockPatientData.currentMedications.map((medication, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{medication.split(' - ')[0]}</p>
                <p className="text-sm text-gray-600">{medication.split(' - ')[1]}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Additional Notes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Important Medical Information</p>
              <p className="text-sm text-yellow-700 mt-1">
                Patient has a history of cardiac procedures. Please ensure all treatments are reviewed 
                by cardiology team before approval. Patient is compliant with current medication regimen.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PatientInformation;