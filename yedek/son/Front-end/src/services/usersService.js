import client from '../apolloClient';
import { CREATE_USER_MUTATION } from '../graphql/auth';

class UsersService {
  async createUser({ email, password, fullName, role = 'user' }) {
    const { data } = await client.mutate({
      mutation: CREATE_USER_MUTATION,
      variables: { input: { email, password, fullName, role } },
    });
    return data.createUser;
  }
}

export default new UsersService();
