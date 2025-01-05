import { getSqlClient } from "@/app/lib/data"
import { createClient } from "@vercel/postgres"
import { fetchFilteredInvoices } from "@/app/lib/data"
import { InvoicesTable } from "@/app/lib/definitions"
import { mockInvoices } from "../fixtures/mockData";


jest.mock('@vercel/postgres');
const mockConnectMethod: jest.Mock = jest.fn()
describe('Mock Test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should mock createClient', () => {
        createClient();
        expect(createClient).toHaveBeenCalled();
    });
});

describe("getSqlClient", () => {
    beforeEach(() => jest.clearAllMocks());
    (createClient as jest.Mock).mockReturnValue({
        connect: mockConnectMethod
    })
    it("should call createClient with the correct connection string", async () => {
        await getSqlClient();
        expect(createClient).toHaveBeenCalledWith({
            connectionString: process.env.dashboard_POSTGRES_URL_NON_POOLING,
        });
        expect(mockConnectMethod).toHaveBeenCalled()
    });
})

describe("fetchInvoicePages", () => {
    beforeEach(() => jest.clearAllMocks());
    (createClient as jest.Mock).mockReturnValue({
        connect: mockConnectMethod,
        sql: jest.fn().mockResolvedValue({
            rows: mockInvoices as InvoicesTable[],
            fields: []
        }),
        end: jest.fn()
    })
    it("Test if the query is going to trigger the query function of postgres/vercel", async () => {

        const query = "Delba"
        const r = await fetchFilteredInvoices(query, 1)
        expect(r).toBeDefined()
        expect(r.length).toBe(3);
    })
})