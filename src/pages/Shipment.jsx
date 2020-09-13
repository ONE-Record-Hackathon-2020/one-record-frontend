import React, { useEffect, useCallback, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Grid,
  ListItem,
  Popover,
  makeStyles,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@material-ui/core';
import ShipmentStatus from 'components/shipment/ShipmentStatus';
import LineChart from 'components/stats/LineChart/LineChart';
import Page from 'components/commons/Page/Page';
import ShipmentMap from 'components/shipment/ShipmentMap';
import Event from 'components/event/Event';
import ResponsiveList from 'components/commons/ResponsiveList/ResponsiveList';
import { useHistory, useRouteMatch } from 'react-router-dom';
import mockData from 'mocks/shipments';
import moment from 'moment';
import { StatusColor } from 'const';
import { useAsync } from 'hooks';
import Skeleton from 'react-loading-skeleton';
import shipmentStore from 'stores/shipmentStore';
import Uld from 'components/uld/Uld';
import PhonelinkRingIcon from '@material-ui/icons/PhonelinkRing';
import { observer } from 'mobx-react';
import LoInfoButton from 'components/commons/LoInfoButton/LoInfoButton';

const useStyle = makeStyles((theme) => ({
  mapContainer: {
    width: '100%',
    height: '600px',
  },
  detailsContainer: {
    height: 'fit-content',
  },
  chartContainer: {
    margin: '10px 0',
    height: '400px',
  },
  infoDetails: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  popoverContent: {
    padding: theme.spacing(2)
  },
}));

export default () => {
  const match = useRouteMatch();
  const history = useHistory();

  const [popoverAnchorEl, setPopoverAnchorEl] = React.useState(null);

  const handlePopoverButtonClick = (event) => {
    setPopoverAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setPopoverAnchorEl(null);
  };

  const popoverOpen = Boolean(popoverAnchorEl);
  const popoverId = popoverOpen ? 'notification-popover' : undefined;

  const [checkboxState, setCheckboxState] = React.useState({
    checkedMail: false,
    checkedSMS: false,
    checkedWhatsApp: false,
  });

  const handleCheckboxChange = (event) => {
    setCheckboxState({ ...checkboxState, [event.target.name]: event.target.checked });
  };

  const shipmentId = match.params.id;
  if (!mockData[shipmentId]) {
    history.push('/', null);
    return null;
  }
  const shipment = mockData[shipmentId];

  shipmentStore.setAirwayBill(shipment);

  useEffect(() => {
    const loop = setInterval(() => {
      try {
        shipmentStore.nextStep();
      } catch (e) {
        console.error(e);
        clearInterval(loop);
      }
    }, 5);
    return () => {
      clearInterval(loop);
    };
  }, [shipment]);

  const classes = useStyle();
  const [highlightEventAt, setHighlightEventAt] = useState(null);

  const onEventClick = useCallback(
    (timestamp) => {
      // console.log(timestamp);
      if (timestamp === highlightEventAt) {
        setHighlightEventAt(null);
      } else {
        setHighlightEventAt(timestamp);
      }
    },
    [highlightEventAt],
  );

  return (
    <Page pageName={`Shipment ${shipmentId} details`}>
      <Grid container spacing={0}>
        <Grid item xs={12} md={2}>
          <ULDList />
        </Grid>
        <Grid container item xs={12} md={8} direction='column'>
          <Grid item>
            <ShipmentStatus airWayBill={shipment} />
          </Grid>
          <Grid item className={classes.mapContainer}>
            <ShipmentMap airWayBill={shipment} />
          </Grid>
          <Grid item className={classes.detailsContainer}>
            <ShipmentDetails
              shipment={shipment}
              highlightEventAt={highlightEventAt}
            />
          </Grid>
        </Grid>
        <Grid container item xs={12} md={2} direction='column'>
          <Grid item style={{ textAlign: 'center', paddingTop: 8 }}>
            <Button
              variant='contained'
              color='primary'
              startIcon={<PhonelinkRingIcon />}
              onClick={handlePopoverButtonClick}
            >
              Stay informed
            </Button>
            <Popover
              id={popoverId}
              open={popoverOpen}
              anchorEl={popoverAnchorEl}
              onClose={handlePopoverClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
            >
              <Grid container direction='column' className={classes.popoverContent}>
                <FormGroup column>
                  <FormControlLabel
                    control={<Checkbox checked={checkboxState.checkedMail} onChange={handleCheckboxChange} name="checkedMail" />}
                    label="Mail"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={checkboxState.checkedSMS} onChange={handleCheckboxChange} name="checkedSMS" />}
                    label="SMS"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={checkboxState.checkedWhatsApp} onChange={handleCheckboxChange} name="checkedWhatsApp" />}
                    label="WhatsApp"
                  />
                  <Button variant='contained' color='primary' onClick={handlePopoverClose}>Save</Button>
                </FormGroup>
              </Grid>
            </Popover>
          </Grid>
          <Grid item>
            <EventList
              shipment={shipment}
              onEventClick={onEventClick}
              highlightEventAt={highlightEventAt}
            />
          </Grid>
        </Grid>
      </Grid>
    </Page>
  );
};

const getULDFromOneRecord = () => {
  return fetch(
    'http://onerecord.fr:8083/companies/airfrance/los/Uld_195302',
  ).then(async (response) => response.json());
};

const ULDList = () => {
  // TODO: Get multiple ULDs instead of one
  const { status, value, error } = useAsync(getULDFromOneRecord);
  return (
    <ResponsiveList>
      {status === 'pending' && <Skeleton height={180} count={5} />}
      {status === 'success' && (
        <>
          <Uld uld={value} />
          <Uld
            uld={{
              '@id':
                'http://onerecord.fr:8083/companies/airfrance/los/Uld_195302',
              'https://onerecord.iata.org/ULD#ownerCode': 'AF',
              'https://onerecord.iata.org/ULD#serialNumber': '1335',
              'https://onerecord.iata.org/ULD#uldType': 'AKE',
              'https://onerecord.iata.org/ULD#upid': {
                'https://onerecord.iata.org/Piece#containedPiece': [],
              },
            }}
          />
        </>
      )}
      {status === 'error' && (
        <Card>
          <CardContent>
            <Typography>{error.message}</Typography>
          </CardContent>
        </Card>
      )}
    </ResponsiveList>
  );
};

const EventList = observer(
  ({ shipment, onEventClick, highlightEventAt = null }) => {
    const classes = useStyle();
    const events = shipment
      .filter(({ eta }) =>
        moment(eta).isBefore(moment(shipmentStore.currentTime)),
      )
      .map((step) => {
        if (step.startTemperature > 8) {
          return {
            level: 'error',
            title: 'Temperature issue',
            time: step.eta,
            details: (
              <Typography variant='body2' component='p'>
                {`Piece temperature ${step.startTemperature}°C was over the maximum allowed value of 8.0°C`}
              </Typography>
            ),
          };
        } else if (step.startTemperature < 2) {
          return {
            level: 'error',
            title: 'Temperature issue',
            time: step.eta,
            details: (
              <Typography variant='body2' component='p'>
                {`Piece temperature ${step.startTemperature}°C was below the minimum allowed value of 2.0°C`}
              </Typography>
            ),
          };
        } else {
          return {
            level: 'info',
            title: step.location.type,
            time: step.eta,
            details: (
              <div className={classes.infoDetails}>
                <span>{step.actorName}</span>
                <LoInfoButton loUri={step.actorURI} loType='Company' />
              </div>
            ),
          };
        }
      });

    return (
      <ResponsiveList>
        {events.map((event) => (
          <ListItem>
            <Event
              event={event}
              onEventClick={onEventClick}
              isHighLighted={event.time === highlightEventAt}
            />
          </ListItem>
        ))}
      </ResponsiveList>
    );
  },
);

const ShipmentDetails = observer(({ shipment, highlightEventAt }) => {
  const classes = useStyle();

  const [randomData] = useState(
    shipment.map(({ eta }) => ({
      x: moment(eta).toDate(),
      y: Math.random() * 25,
    })),
  );

  const passedPoints = shipment.filter(({ eta }) =>
    moment(eta).isBefore(moment(shipmentStore.currentTime)),
  );

  const data = passedPoints.map(({ eta, startTemperature }) => ({
    x: moment(eta).toDate(),
    y: startTemperature,
  }));

  const marker = [];
  if (!!highlightEventAt) {
    marker.push({
      axis: 'x',
      value: moment(highlightEventAt).toDate(),
      lineStyle: { stroke: StatusColor.error, strokeWidth: 4 },
    });
  }

  return (
    <Grid container>
      <Grid item xs={12} className={classes.chartContainer}>
        <LineChart
          verticalAxisName={'Température (°C)'}
          series={[
            {
              id: 'Internal temperature',
              data,
            },
          ]}
          min={2}
          max={8}
          defaultMarkers={marker}
        />
      </Grid>
      <Grid item xs={12} className={classes.chartContainer}>
        <LineChart
          verticalAxisName='Hygrometry (%)'
          series={[
            {
              id: 'Hygrometry',
              data: randomData.filter(({ x }) =>
                moment(x).isBefore(moment(shipmentStore.currentTime)),
              ),
            },
          ]}
        />
      </Grid>
    </Grid>
  );
});
