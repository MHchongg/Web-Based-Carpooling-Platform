import * as React from 'react';
import './index.scss'
import '@geoapify/geocoder-autocomplete/styles/minimal.css'
import '@geoapify/geocoder-autocomplete/styles/round-borders.css'
import { GeoapifyContext, GeoapifyGeocoderAutocomplete } from '@geoapify/react-geocoder-autocomplete';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DemoItem } from '@mui/x-date-pickers/internals/demo';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs'
import { Button, Box, Menu, MenuItem, Slide, Dialog, AppBar, Toolbar, IconButton, Typography, DialogContentText, DialogActions, DialogContent } from '@mui/material';
import PropTypes from 'prop-types';
import { Select as BaseSelect, selectClasses } from '@mui/base/Select';
import { Option as BaseOption, optionClasses } from '@mui/base/Option';
import SearchIcon from '@mui/icons-material/Search';
import { orange } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import AlertMsg from '../../components/AlertMsg'
import ExpandCircleDownTwoToneIcon from '@mui/icons-material/ExpandCircleDownTwoTone';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useSelector, useDispatch } from 'react-redux';
import { postCarpool, getCarpoolList, getMyCarpoolJoinRequest, getMyCarpoolList, getMyJoinRequests, getDriverIsMeGroup, searchCarpools } from '../../store/modules/carpoolStore';
import CarpoolList from './CarpoolList';
import Loading from '../../components/Loading';

const geoapify_api_key = process.env.REACT_APP_GEOAPIFY_API_KEY

let utc = require('dayjs/plugin/utc')
let timezone = require('dayjs/plugin/timezone')
let customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat);

// Load timezone data for Malaysia
require('dayjs/locale/ms');

// Set the timezone to Malaysia
dayjs.tz.setDefault('Asia/Kuala_Lumpur');
const format = 'MM/DD/YYYY hh:mm A';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const MyButton = styled(Button)(({ theme }) => ({
    backgroundColor: orange[500],
    '&:hover': {
        backgroundColor: orange[700],
    },
}));

const Carpools = () => {

    const [showAlert, setShowAlert] = useState({ alert: false, status: true, msg: '' })
    const { userInfo } = useSelector(state => state.user)
    const dispatch = useDispatch()
    const [menuBtnText, setMenuBtnText] = useState('Available Carpools')
    const [isLoading, setIsLoading] = useState(false)

    const [searchType, setSearchType] = useState('fromDriver') // search carpool
    const [searchResult, setSearchResult] = useState([])

    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        async function fetchCarpoolInfo() {
            await dispatch(getCarpoolList());
            await dispatch(getMyCarpoolList(userInfo.user_email))
            await dispatch(getMyCarpoolJoinRequest(userInfo.user_email))
            await dispatch(getDriverIsMeGroup(userInfo.user_email))
            setIsLoading(false)
        }
        fetchCarpoolInfo();
    }, [dispatch, userInfo.user_email])

    // State to track active button index
    const [btnActiveIndex, setBtnActiveIndex] = useState(0);

    // Function to handle button click
    const handleBtnActiveClick = async (index) => {
        handleMenuClose()
        setBtnActiveIndex(index);

        switch (index) {
            case 0:
                setIsLoading(true)
                await dispatch(getCarpoolList());
                await dispatch(getDriverIsMeGroup(userInfo.user_email))
                setMenuBtnText('Available Carpools')
                setIsLoading(false)
                handleMenuClose()
                break;

            case 1:
                setIsLoading(true)
                await dispatch(getCarpoolList());
                await dispatch(getDriverIsMeGroup(userInfo.user_email))
                setMenuBtnText('Request from Students')
                setIsLoading(false)
                handleMenuClose()
                break;

            case 2:
                setIsLoading(true)
                await dispatch(getCarpoolList());
                await dispatch(getMyCarpoolList(userInfo.user_email))
                await dispatch(getDriverIsMeGroup(userInfo.user_email))
                setMenuBtnText('My Carpools')
                setIsLoading(false)
                handleMenuClose()
                break;

            case 3:
                setIsLoading(true)
                await dispatch(getCarpoolList());
                await dispatch(getMyCarpoolJoinRequest(userInfo.user_email))
                await dispatch(getDriverIsMeGroup(userInfo.user_email))
                setMenuBtnText("My Carpools' join requests")
                setIsLoading(false)
                handleMenuClose()
                break;

            case 4:
                setIsLoading(true)
                await dispatch(getCarpoolList());
                await dispatch(getMyJoinRequests(userInfo.user_email))
                await dispatch(getDriverIsMeGroup(userInfo.user_email))
                setMenuBtnText("My join requests")
                setIsLoading(false)
                handleMenuClose()
                break;

            case 5:
                setIsLoading(true)
                await dispatch(getCarpoolList());
                await dispatch(getDriverIsMeGroup(userInfo.user_email))
                let text = searchType === 'fromDriver' ? 'Available Carpools' : 'Requests from students'
                setMenuBtnText(`Search Result: ${text}`)
                setIsLoading(false)
                break;

            default:
                console.log('no action')
                break;
        }
    }

    // Search Carpool
    const [fromAddress, setFromAddress] = useState({})
    const [toAddress, setToAddress] = useState({})
    const [dateTime, setDateTime] = useState(dayjs())

    const handleFromAddress = (value) => {
        if (value) {
            setFromAddress({
                fromAddr: value.properties.formatted,
                from_lat: value.properties.lat,
                from_lon: value.properties.lon,
            })
        }
        else {
            setFromAddress({})
        }
    }

    const handleToAddress = (value) => {
        if (value) {
            setToAddress({
                toAddr: value.properties.formatted,
                to_lat: value.properties.lat,
                to_lon: value.properties.lon,
            })
        }
        else {
            setToAddress({})
        }
    }

    const searchCarpool = async (event) => {
        event.preventDefault()

        if (Object.keys(fromAddress).length === 0 || Object.keys(toAddress).length === 0) {
            setShowAlert({ alert: true, status: false, msg: 'Please input your source and destination address' })
        }
        else if (dateTime.isBefore(dayjs(), 'day')) {
            setShowAlert({ alert: true, status: false, msg: 'Please input valid date time' })
        }
        else {
            setIsLoading(true)
            const response = await dispatch(searchCarpools(fromAddress, toAddress, dateTime, searchType))
            setSearchResult(response)
            handleBtnActiveClick(5)
        }
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setShowAlert(prevAlert => ({ ...prevAlert, alert: false }))
    };

    // Form (post action)
    const [fullScreenDialogOpen, setFullScreenDialogOpen] = useState(false);
    const [formFromAddress, setFormFromAddress] = useState({})
    const [formToAddress, setFormToAddress] = useState({})
    const [formDateTime, setFormDateTime] = useState(dayjs())
    const [formPrice, setFormPrice] = useState(0)
    const [formSeats, setFormSeats] = useState(2)
    const [formTitle, setFormTitle] = useState('')
    const [formType, setFormType] = useState('fromDriver')
    const [submitBtnDisable, setSubmitBtnDisable] = useState(false)

    const handleFormFromAddress = (value) => {
        if (value) {
            setFormFromAddress({
                fromAddr: value.properties.formatted,
                from_lat: value.properties.lat,
                from_lon: value.properties.lon,
            })
        }
        else {
            setFormFromAddress({})
        }
    }

    const handleFormToAddress = (value) => {
        if (value) {
            setFormToAddress({
                toAddr: value.properties.formatted,
                to_lat: value.properties.lat,
                to_lon: value.properties.lon,
            })
        }
        else {
            setFormToAddress({})
        }
    }

    const submitCarpoolForm = async (event) => {
        event.preventDefault()

        if (Object.keys(formFromAddress).length === 0 || Object.keys(formToAddress).length === 0) {
            setShowAlert({ alert: true, status: false, msg: 'Please input your source and destination address' })
        }
        else if (formDateTime.isBefore(dayjs(), 'day')) {
            setShowAlert({ alert: true, status: false, msg: 'Please input valid date time' })
        }
        else {
            const response = await dispatch(postCarpool({
                carpool_title: formTitle,
                carpool_type: formType,
                carpool_from: formFromAddress,
                carpool_to: formToAddress,
                carpool_dateTime: dayjs.tz(formDateTime, format, 'Asia/Kuala_Lumpur').format(),
                carpool_price: formPrice,
                carpool_seats: formSeats,
                user_email: userInfo.user_email,
                user_name: userInfo.user_name,
            }))
            setSubmitBtnDisable(true)
            setFullScreenDialogOpen(false)
            setShowAlert(response)
        }
    }

    const postAction = (type) => {
        handleMenuClose()
        setFormType(type)
        setFullScreenDialogOpen(true)
        setSubmitBtnDisable(false)
    }
    
    return (
        <div className='carpool-page'>
            <div className='search-div'>
                <h1>Find the carpool that suits your preferences</h1>
                <form className='search-components' onSubmit={searchCarpool}>
                    <div className='departure-address'>
                        <GeoapifyContext apiKey={geoapify_api_key}>
                            <GeoapifyGeocoderAutocomplete
                                placeholder="Enter your departure address here"
                                type='amenity'
                                placeSelect={handleFromAddress}
                            />
                        </GeoapifyContext>
                    </div>

                    <div className='destination-address'>
                        <GeoapifyContext apiKey={geoapify_api_key}>
                            <GeoapifyGeocoderAutocomplete
                                placeholder="Enter your destination address here"
                                type='amenity'
                                placeSelect={handleToAddress}
                            />
                        </GeoapifyContext>
                    </div>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DemoItem>
                            <DateTimePicker value={dateTime} onChange={(newDateTime) => setDateTime(newDateTime)}/>
                        </DemoItem>
                    </LocalizationProvider>

                    <Select defaultValue={searchType} id="named-select" name="demo-select">
                        <Option value={'fromDriver'} onClick={() => setSearchType('fromDriver')}>Available Carpools</Option>
                        {userInfo.user_role === 'Driver' && <Option value={'fromStudent'} onClick={() => setSearchType('fromStudent')}>Request from students</Option>}
                    </Select>

                    <MyButton variant='contained' endIcon={<SearchIcon />} sx={{ backgroundColor: orange[500] }} type='submit'>Search</MyButton>
                </form>
            </div>
            
            <div className='carpool-options'>
                <Box>
                    <MyButton
                        startIcon={<ExpandCircleDownTwoToneIcon />}
                        variant='contained'
                        id="demo-positioned-button"
                        aria-controls={openMenu ? 'demo-positioned-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={openMenu ? 'true' : undefined}
                        onClick={handleMenuClick}
                        sx={{ width: '100%', fontWeight: 'bold' }}
                    >
                        {menuBtnText}
                    </MyButton>

                    <Menu
                        id="demo-positioned-menu"
                        aria-labelledby="demo-positioned-button"
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={handleMenuClose}
                    >
                        <MenuItem className={btnActiveIndex === 0 ? 'selected-menu-option' : ''} onClick={() => handleBtnActiveClick(0)}>Available Carpools</MenuItem>
                        {userInfo.user_role === 'Driver' && <MenuItem className={btnActiveIndex === 1 ? 'selected-menu-option': ''} onClick={() => handleBtnActiveClick(1)}>Requests from Students</MenuItem>}
                        <MenuItem className={btnActiveIndex === 2 ? 'selected-menu-option' : ''} onClick={() => handleBtnActiveClick(2)}>My Carpools</MenuItem>
                        {userInfo.user_role === 'Driver' && <MenuItem className={btnActiveIndex === 3 ? 'selected-menu-option': ''} onClick={() => handleBtnActiveClick(3)}>My Carpools' join requests</MenuItem>}
                        <MenuItem className={btnActiveIndex === 4 ? 'selected-menu-option': ''} onClick={() => handleBtnActiveClick(4)}>My join requests</MenuItem>
                        {userInfo.user_role === 'Driver' && <MenuItem onClick={() => postAction('fromDriver')}><AddIcon sx={{ color: '#5b277b' }} />Post a ride</MenuItem>}
                        <MenuItem onClick={() => postAction('fromStudent')}><AddIcon sx={{ color: '#5b277b' }} />Post a request</MenuItem>
                    </Menu>
                </Box>
                <br />

                {isLoading ? <Loading /> : <CarpoolList category={btnActiveIndex} searchResult={searchResult}/>}

                <React.Fragment>
                    <Dialog
                        fullScreen
                        open={fullScreenDialogOpen}
                        onClose={() => setFullScreenDialogOpen(false)}
                        TransitionComponent={Transition}
                        PaperProps={{
                            component: 'form',
                            onSubmit: submitCarpoolForm,
                        }}
                    >
                        <AppBar sx={{ position: 'relative', backgroundColor: '#5b277b' }}>
                            <Toolbar>
                                <IconButton
                                    edge="start"
                                    color="inherit"
                                    onClick={() => setFullScreenDialogOpen(false)}
                                    aria-label="close"
                                >
                                    <CloseIcon />
                                </IconButton>
                                <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                                    Carpool Form
                                </Typography>
                            </Toolbar>
                        </AppBar>
                        <DialogContent>
                            <DialogContentText sx={{ fontWeight: 'bold' }}>Date Time</DialogContentText>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DemoItem>
                                    <DateTimePicker value={formDateTime} onChange={(newFormDateTime) => setFormDateTime(newFormDateTime)} />
                                </DemoItem>
                            </LocalizationProvider>
                            <br />
                            <DialogContentText sx={{ fontWeight: 'bold' }}>Departure Address</DialogContentText>
                            <GeoapifyContext apiKey={geoapify_api_key}>
                                <GeoapifyGeocoderAutocomplete
                                    placeholder="Enter your departure address here"
                                    type='amenity'
                                    placeSelect={handleFormFromAddress}
                                />
                            </GeoapifyContext>
                            <br />
                            <DialogContentText sx={{ fontWeight: 'bold' }}>Destination Address</DialogContentText>
                            <GeoapifyContext apiKey={geoapify_api_key}>
                                <GeoapifyGeocoderAutocomplete
                                    placeholder="Enter your destination address here"
                                    type='amenity'
                                    placeSelect={handleFormToAddress}
                                />
                            </GeoapifyContext>
                            <br />
                            <DialogContentText sx={{ fontWeight: 'bold' }}>Price (per pax)</DialogContentText>
                            <input type="number" id='price' name='price' placeholder="0.0" step="0.01" min="0" onChange={(e) => setFormPrice(e.target.value)} />
                            <br /><br />
                            <DialogContentText sx={{ fontWeight: 'bold' }}>Seats</DialogContentText>
                            <input type="number" id='seats' name='seats' placeholder="2" min="2" onChange={(e) => setFormSeats(e.target.value)} />
                            <br /><br />
                            <DialogContentText sx={{ fontWeight: 'bold' }}>Carpool Title</DialogContentText>
                            <input type="text" id='title' name='title' placeholder="Give your carpool a title (e.g Melaka to Johor)" minLength={5} style={{ padding: '0.5rem', width: '100%' }} onChange={(e) => setFormTitle(e.target.value)} required />
                            <br /><br />
                            <DialogActions sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Button 
                                    type='submit'
                                    disabled={submitBtnDisable}
                                    className='carpool-form-submit-btn'
                                >
                                    Submit
                                </Button>
                            </DialogActions>
                        </DialogContent>
                    </Dialog>
                </React.Fragment>
                
            </div>

            <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
        </div>
    )
}

export default Carpools

const Select = React.forwardRef(function CustomSelect(props, ref) {
    const slots = {
        root: Typebutton,
        listbox: Listbox,
        popup: Popup,
        ...props.slots,
    };

    return <BaseSelect {...props} ref={ref} slots={slots} />;
});

const blue = {
    100: '#DAECFF',
    200: '#99CCF3',
    300: '#66B2FF',
    400: '#3399FF',
    500: '#007FFF',
    600: '#0072E5',
    700: '#0066CC',
    900: '#003A75',
};

const grey = {
    50: '#F3F6F9',
    100: '#E5EAF2',
    200: '#DAE2ED',
    300: '#C7D0DD',
    400: '#B0B8C4',
    500: '#9DA8B7',
    600: '#6B7A90',
    700: '#434D5B',
    800: '#303740',
    900: '#1C2025',
};

const Typebutton = React.forwardRef(function Typebutton(props, ref) {
    const { ownerState, ...other } = props;
    return (
        <StyledButton type="button" {...other} ref={ref}>
            {other.children}
            <UnfoldMoreRoundedIcon />
        </StyledButton>
    );
});

Typebutton.propTypes = {
    children: PropTypes.node,
    ownerState: PropTypes.object.isRequired,
};

const StyledButton = styled('button', { shouldForwardProp: () => true })(
    ({ theme }) => `
  position: relative;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  box-sizing: border-box;
  min-width: 320px;
  padding: 8px 12px;
  border-radius: 8px;
  text-align: left;
  line-height: 1.5;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  box-shadow: 0px 2px 6px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0, 0.50)' : 'rgba(0,0,0, 0.05)'
        };

  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 120ms;

  &:hover {
    background: ${theme.palette.mode === 'dark' ? grey[800] : grey[50]};
    border-color: ${theme.palette.mode === 'dark' ? grey[600] : grey[300]};
  }

  &.${selectClasses.focusVisible} {
    outline: 0;
    border-color: ${blue[400]};
    box-shadow: 0 0 0 3px ${theme.palette.mode === 'dark' ? blue[600] : blue[200]};
  }

  & > svg {
    font-size: 1rem;
    position: absolute;
    height: 100%;
    top: 0;
    right: 10px;
  }
  `,
);

const Listbox = styled('ul')(
    ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  box-sizing: border-box;
  padding: 6px;
  margin: 12px 0;
  min-width: 320px;
  border-radius: 12px;
  overflow: auto;
  outline: 0px;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  box-shadow: 0px 2px 6px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0, 0.50)' : 'rgba(0,0,0, 0.05)'
        };
  `,
);

const Option = styled(BaseOption)(
    ({ theme }) => `
  list-style: none;
  padding: 8px;
  border-radius: 8px;
  cursor: default;

  &:last-of-type {
    border-bottom: none;
  }

  &.${optionClasses.selected} {
    background-color: ${theme.palette.mode === 'dark' ? blue[900] : blue[100]};
    color: ${theme.palette.mode === 'dark' ? blue[100] : blue[900]};
  }

  &.${optionClasses.highlighted} {
    background-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }

  &.${optionClasses.highlighted}.${optionClasses.selected} {
    background-color: ${theme.palette.mode === 'dark' ? blue[900] : blue[100]};
    color: ${theme.palette.mode === 'dark' ? blue[100] : blue[900]};
  }

  &:focus-visible {
    outline: 3px solid ${theme.palette.mode === 'dark' ? blue[600] : blue[200]};
  }

  &.${optionClasses.disabled} {
    color: ${theme.palette.mode === 'dark' ? grey[700] : grey[400]};
  }

  &:hover:not(.${optionClasses.disabled}) {
    background-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }
  `,
);

const Popup = styled('div')`
  z-index: 1;
`;