/**
 * @jest-environment jsdom
 */

import NewBillUI from '../views/NewBillUI';
import NewBill from '../containers/NewBill';
import { fireEvent, screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import mockStore from '../__mocks__/store';

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      document.body.innerHTML = NewBillUI();

      window.localStorage.setItem("user", JSON.stringify({ email: 'test@example.com' }));

      new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      window.alert = jest.fn();
    });

    it("should render the form", () => {
      expect(screen.getByTestId('form-new-bill')).toBeTruthy();
    });

    it('should display an alert for unsupported file types', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      const fileList = {
        0: file,
        length: 1,
      };

      const fileInput = screen.getByTestId('file');
      
      fireEvent.change(fileInput, { target: { files: fileList } });

      expect(window.alert).toHaveBeenCalledWith('Ce format de fichier n\'est pas accepté');
      expect(fileInput.value).toBe('');
    });

    it('should call store.bills().create with the correct data when uploading file', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file');
      
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockStore.bills().create).toHaveBeenCalledWith({
          data: expect.any(FormData),
          headers: { noContentType: true },
        });

        const formData = mockStore.bills().create.mock.calls[0][0].data;
        expect(formData.get('file')).toEqual(file);
        expect(formData.get('email')).toBe('test@example.com');
      });
    });

    it('should call store.bills().update with the correct data on file submit', async () => {
      fireEvent.input(screen.getByTestId('expense-name'), { target: { value: 'Test bill' } });
      fireEvent.input(screen.getByTestId('amount'), { target: { value: '100' } });
      fireEvent.input(screen.getByTestId('datepicker'), { target: { value: '2021-09-01' } });
      userEvent.selectOptions(screen.getByTestId('expense-type'), 'Transports');
    
      const form = screen.getByTestId('form-new-bill');
      fireEvent.submit(form);
    
      await waitFor(() => {
        const updateCall = mockStore.bills().update.mock.calls[0][0];
        const data = JSON.parse(updateCall.data);
    
        expect(data).toEqual(expect.objectContaining({
          email: 'test@example.com',
          type: 'Transports',
          name: 'Test bill',
          amount: 100,
          date: '2021-09-01',
          vat: '',
          pct: 20,
          commentary: '',
          fileUrl: null,
          fileName: null,
          status: 'pending'
        }));
      });
    });
  });
});
