/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import Bills from "../containers/Bills.js"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)

    })
    test("Then bills should be ordered from earliest to latest", () => {

      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)

    })
    test("then the new bill button should be displayed", async () => {
      document.body.innerHTML = BillsUI({ data: bills })
      await waitFor(() => screen.getByTestId('btn-new-bill'))
      const newBillButton = screen.getByTestId('btn-new-bill')
      expect(newBillButton).toBeTruthy()
    })

    describe('When I click on the eye icon', () => {
      test('Then it should renders the modal', async () => {
        const user = userEvent.setup();
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const billsInstance = new Bills({
          document,
          onNavigate,
          mockStore,
          localStorage: window.localStorage
        });
  
        await waitFor(() => screen.getAllByTestId('icon-eye')[0]);
        const iconEye = screen.getAllByTestId('icon-eye')[0];
        expect(iconEye).toBeTruthy();
        
        $.fn.modal = jest.fn();
        $.fn.width = jest.fn().mockReturnValue(500);
        $.fn.find = jest.fn().mockReturnThis();
        $.fn.html = jest.fn();
        
        const handleClickIconEye = jest.fn(() => {
          billsInstance.handleClickIconEye(iconEye);
        });
  
        iconEye.addEventListener('click', handleClickIconEye);
  
        await user.click(iconEye);
        expect(handleClickIconEye).toHaveBeenCalled();
        expect($.fn.modal).toHaveBeenCalledWith('show');
  
        const billUrl = iconEye.getAttribute('data-bill-url');
        const imgWidth = Math.floor($('#modaleFile').width() * 0.5);
  
        $('#modaleFile').find('.modal-body').html(
          `<div style='text-align: center;' class="bill-proof-container">
            <img width=${imgWidth} src=${billUrl} alt="Bill" />
          </div>`);
  
        expect($.fn.find).toHaveBeenCalled();
        expect($.fn.html).toHaveBeenCalledWith(
          `<div style='text-align: center;' class="bill-proof-container">
            <img width=${imgWidth} src=${billUrl} alt="Bill" />
          </div>`
        );
        expect($.fn.width).toHaveBeenCalled();
        expect(imgWidth).toBe(250);
      });
    });

    describe("when i click on the new bill button", () => {
      test("then the new bill form should display", async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
      
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
      
        document.body.innerHTML = BillsUI({ data: bills })
      
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const store = jest.fn();

        new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage
        })
      
        await waitFor(() => screen.getByTestId('btn-new-bill'))
        const newBillButton = screen.getByTestId('btn-new-bill')
      
        fireEvent.click(newBillButton)

        await waitFor(() => {
          const formNewBill = screen.queryByTestId('form-new-bill')
          expect(formNewBill).toBeTruthy()
        })
      })
    })

    describe('When I click on "Return" button from navigator', () => {
      test('Then I stay on Bills page', async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }));
        document.body.innerHTML = BillsUI({ data: bills });

        window.history.pushState({}, 'somewhere', '/employee/somewhere')
        window.history.back()
        expect(screen.getByText('Mes notes de frais')).toBeTruthy()
      });
    });

    // integration test GET
    describe("when i call getBills", () => {
      test("then it should fetch bills from the mock API store", async () => {
        const billsInstance = new Bills({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
        });

        const result = await billsInstance.getBills();
  
        expect(result.length).toBe(4);
        expect(result[0].status).toBe("En attente");
        expect(result[1].status).toBe("Refusé");
        expect(result[2].status).toBe("Accepté");
      });
    });

    describe("when an error occurs on API", () => {
      test("fetches bills from an API and fails with 401 message error", async () => {
        jest.spyOn(mockStore, "bills");
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 401"));
            }
          }});
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 401/);
        expect(message).toBeTruthy();
      });
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }));
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"));
            }
          }});
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
  
      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"));
            }
          }});
  
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  })
})
