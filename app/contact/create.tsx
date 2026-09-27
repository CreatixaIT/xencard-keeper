import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ContactForm from '../../src/components/ContactForm';
import { createContact, updateContact } from '../../src/db/repositories/contactRepository';
import { useContactStore } from '../../src/stores/contactStore';
import type { VisitingCard } from '../../src/types';

export default function CreateContactScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { refreshStats } = useContactStore();
  const isEditing = !!id;

  const handleSave = async (contact: Omit<VisitingCard, 'id' | 'createdTimestamp'>) => {
    try {
      if (isEditing && id) {
        await updateContact(id, contact);
      } else {
        await createContact(contact);
      }
      await refreshStats();
      router.back();
    } catch (error) {
      console.error('Failed to save contact:', error);
      if (error instanceof Error && error.message.includes('Card limit reached')) {
        alert(error.message);
      }
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <ContactForm 
        onSave={handleSave} 
        onCancel={handleCancel}
        contactId={id}
        isEditing={isEditing}
      />
    </View>
  );
}
